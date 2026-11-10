const NOTION_VERSION = "2025-09-03";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = new Set([
      env.ALLOWED_ORIGIN,
      "https://helifrozenyogurt.com",
      "https://www.helifrozenyogurt.com",
    ]);
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigins.has(origin)
        ? origin
        : env.ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    };

    if (request.method === "OPTIONS") {
      return allowedOrigins.has(origin)
        ? new Response(null, { status: 204, headers: corsHeaders })
        : json({ success: false, error: "Origin not allowed" }, 403, corsHeaders);
    }

    if (request.method !== "POST") {
      return json({ success: false, error: "Method not allowed" }, 405, corsHeaders);
    }

    if (!allowedOrigins.has(origin)) {
      return json({ success: false, error: "Origin not allowed" }, 403, corsHeaders);
    }

    try {
      const contentType = request.headers.get("Content-Type") || "";
      if (!contentType.includes("application/json")) {
        return json(
          { success: false, error: "Content-Type must be application/json" },
          415,
          corsHeaders
        );
      }

      const contentLength = Number(request.headers.get("Content-Length") || 0);
      if (contentLength > 20000) {
        return json(
          { success: false, error: "Submission is too large" },
          413,
          corsHeaders
        );
      }

      const raw = await request.json();

      // Honeypot field for basic bot protection.
      if (raw.website) {
        return json({ success: true }, 200, corsHeaders);
      }

      const data = validate(raw);
      const response = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.NOTION_TOKEN}`,
          "Content-Type": "application/json",
          "Notion-Version": NOTION_VERSION,
        },
        body: JSON.stringify({
          parent: {
            type: "data_source_id",
            data_source_id: env.NOTION_DATA_SOURCE_ID,
          },
          properties: notionProperties(data),
        }),
      });

      if (!response.ok) {
        const notionError = await response.text();
        console.error("Notion submission failed", response.status, notionError);
        return json(
          {
            success: false,
            error: "We could not save your submission. Please try again.",
          },
          502,
          corsHeaders
        );
      }

      const page = await response.json();
      return json(
        { success: true, submissionId: page.id },
        201,
        corsHeaders
      );
    } catch (error) {
      console.error(
        "Form submission error",
        error instanceof Error ? error.message : "Unknown error"
      );
      return json(
        {
          success: false,
          error:
            error instanceof ValidationError
              ? error.message
              : "Something went wrong. Please try again.",
        },
        error instanceof ValidationError ? 400 : 500,
        corsHeaders
      );
    }
  },
};

class ValidationError extends Error {}

function validate(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ValidationError("Invalid submission.");
  }

  const type = text(raw.type, 50);
  const validTypes = [
    "Property inquiry",
    "Customer feedback",
    "Referral",
    "Event inquiry",
  ];

  if (!validTypes.includes(type)) {
    throw new ValidationError("Invalid submission type.");
  }

  const data = {
    type,
    location: text(raw.location, 200),
    rating: rating(raw.rating),
    feedback: text(raw.feedback, 2000),
    contactName: text(raw.contactName, 150),
    email: email(raw.email),
    phone: text(raw.phone, 50),
    propertyType: text(raw.propertyType, 100),
    addressCity: text(raw.addressCity, 250),
    // Event details are carried in this existing field by the Events page.
    footTraffic: text(raw.footTraffic, 2000),
    connectionToLocation: text(raw.connectionToLocation, 1000),
  };

  if (!data.location) {
    throw new ValidationError("Location or property name is required.");
  }

  if (type === "Property inquiry") {
    requireContactAndPropertyDetails(data);
  }

  if (type === "Event inquiry") {
    if (!data.contactName) {
      throw new ValidationError("Contact name is required.");
    }
    if (!data.email) {
      throw new ValidationError("Contact email is required.");
    }
    if (!data.propertyType) {
      throw new ValidationError("Event type is required.");
    }
    if (!data.footTraffic) {
      throw new ValidationError("Event details are required.");
    }
  }

  if (type === "Customer feedback") {
    if (!data.rating) {
      throw new ValidationError("Please select a rating.");
    }
    if (!data.feedback) {
      throw new ValidationError("Please enter your feedback.");
    }
  }

  if (type === "Referral") {
    if (!data.addressCity) {
      throw new ValidationError("City is required.");
    }
    if (!data.contactName) {
      throw new ValidationError("Your name is required.");
    }
    if (!data.email) {
      throw new ValidationError("Your email is required.");
    }
    if (!data.connectionToLocation) {
      throw new ValidationError(
        "Please describe your connection to the location."
      );
    }
  }

  return data;
}

function requireContactAndPropertyDetails(data) {
  if (!data.contactName) {
    throw new ValidationError("Contact name is required.");
  }
  if (!data.email) {
    throw new ValidationError("Contact email is required.");
  }
  if (!data.propertyType) {
    throw new ValidationError("Property type is required.");
  }
  if (!data.addressCity) {
    throw new ValidationError("Address or city is required.");
  }
}

function notionProperties(data) {
  let prefix = data.type;

  const properties = {
    Submission: title(`${prefix}: ${data.location}`),
    Type: select(data.type),
    "Location / Property": richText(data.location),
    Status: select("New"),
    Source: select("Heli website"),
  };

  optional(
    properties,
    "Rating",
    data.rating ? { number: data.rating } : null
  );
  optional(
    properties,
    "Feedback",
    data.feedback ? richText(data.feedback) : null
  );
  optional(
    properties,
    "Contact name",
    data.contactName ? richText(data.contactName) : null
  );
  optional(
    properties,
    "Email",
    data.email ? { email: data.email } : null
  );
  optional(
    properties,
    "Phone",
    data.phone ? { phone_number: data.phone } : null
  );
  optional(
    properties,
    "Property type",
    data.propertyType ? select(data.propertyType) : null
  );
  optional(
    properties,
    "Address / City",
    data.addressCity ? richText(data.addressCity) : null
  );
  optional(
    properties,
    "Foot traffic",
    data.footTraffic ? richText(data.footTraffic) : null
  );
  optional(
    properties,
    "Connection to location",
    data.connectionToLocation ? richText(data.connectionToLocation) : null
  );

  return properties;
}

function title(value) {
  return {
    title: [
      {
        type: "text",
        text: { content: value },
      },
    ],
  };
}

function richText(value) {
  return {
    rich_text: [
      {
        type: "text",
        text: { content: value },
      },
    ],
  };
}

function select(value) {
  return { select: { name: value } };
}

function optional(properties, name, value) {
  if (value) {
    properties[name] = value;
  }
}

function text(value, limit) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().replace(/\s+/g, " ").slice(0, limit);
}

function email(value) {
  const result = text(value, 254).toLowerCase();
  if (result && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) {
    throw new ValidationError("Please enter a valid email address.");
  }
  return result;
}

function rating(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const result = Number(value);
  if (!Number.isInteger(result) || result < 1 || result > 5) {
    throw new ValidationError("Rating must be between 1 and 5.");
  }
  return result;
}

function json(body, status, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...headers,
    },
  });
}
