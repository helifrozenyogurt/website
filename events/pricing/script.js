(function () {
  var minimumGuests = 20;
  var maximumGuests = 75;
  var setupFee = 300;
  var pricePerGuest = 9;
  var durationFees = {
    60: 0,
    90: 75,
    120: 150
  };

  function clampGuestCount(value) {
    var numericValue = Number(value);
    var safeValue = Number.isFinite(numericValue) ? numericValue : minimumGuests;
    return Math.min(maximumGuests, Math.max(minimumGuests, Math.round(safeValue)));
  }

  function recommendedDuration(guestCount) {
    var normalizedCount = clampGuestCount(guestCount);

    if (normalizedCount <= 30) {
      return 60;
    }
    if (normalizedCount <= 50) {
      return 90;
    }
    return 120;
  }

  function normalizeDuration(duration, guestCount) {
    var numericDuration = Number(duration);
    return Object.prototype.hasOwnProperty.call(durationFees, numericDuration)
      ? numericDuration
      : recommendedDuration(guestCount);
  }

  function calculateTotal(guestCount, duration) {
    var normalizedCount = clampGuestCount(guestCount);
    var normalizedDuration = normalizeDuration(duration, normalizedCount);
    return setupFee + (pricePerGuest * normalizedCount) + durationFees[normalizedDuration];
  }

  function durationLabel(duration) {
    return Number(duration) === 120 ? '2 hours' : String(duration) + ' minutes';
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      calculateTotal: calculateTotal,
      clampGuestCount: clampGuestCount,
      recommendedDuration: recommendedDuration,
      durationLabel: durationLabel
    };
  }

  if (typeof document === 'undefined') {
    return;
  }

  var guestInput = document.getElementById('guestCountCalculator');
  var guestRange = document.getElementById('guestRange');
  var decreaseButton = document.getElementById('decreaseGuests');
  var increaseButton = document.getElementById('increaseGuests');
  var durationInputs = Array.prototype.slice.call(document.querySelectorAll('input[name="serviceDuration"]'));
  var durationRecommendation = document.getElementById('durationRecommendation');
  var totalResult = document.getElementById('totalResult');
  var estimateSummary = document.getElementById('estimateSummary');

  if (!guestInput || !guestRange || !durationInputs.length || !totalResult || !estimateSummary) {
    return;
  }

  var lastRecommendedDuration = null;

  function selectedDuration() {
    var checkedInput = durationInputs.find(function (input) {
      return input.checked;
    });
    return checkedInput ? Number(checkedInput.value) : null;
  }

  function selectDuration(duration) {
    durationInputs.forEach(function (input) {
      input.checked = Number(input.value) === Number(duration);
    });
  }

  function render(guestCount, synchronizeInput, guestCountChanged) {
    var normalizedCount = clampGuestCount(guestCount);
    var recommended = recommendedDuration(normalizedCount);
    var selected = selectedDuration();

    if (selected === null || (guestCountChanged && (lastRecommendedDuration === null || selected === lastRecommendedDuration))) {
      selected = recommended;
      selectDuration(selected);
    }

    selected = normalizeDuration(selected, normalizedCount);
    lastRecommendedDuration = recommended;

    if (synchronizeInput) {
      guestInput.value = String(normalizedCount);
    }
    guestRange.value = String(normalizedCount);
    totalResult.textContent = formatCurrency(calculateTotal(normalizedCount, selected));
    estimateSummary.textContent = 'Includes unlimited Heli cups for ' + normalizedCount + ' booked guests during ' + durationLabel(selected) + ' of service.';

    if (durationRecommendation) {
      if (selected < recommended) {
        durationRecommendation.textContent = 'For a smoother guest experience, we recommend ' + durationLabel(recommended) + ' for this guest count.';
        durationRecommendation.hidden = false;
      } else {
        durationRecommendation.textContent = '';
        durationRecommendation.hidden = true;
      }
    }

    if (decreaseButton) {
      decreaseButton.disabled = normalizedCount <= minimumGuests;
    }
    if (increaseButton) {
      increaseButton.disabled = normalizedCount >= maximumGuests;
    }
  }

  guestInput.addEventListener('input', function () {
    var parsedValue = Number(guestInput.value);
    if (guestInput.value !== '' && Number.isFinite(parsedValue)) {
      render(parsedValue, false, true);
    }
  });

  guestInput.addEventListener('change', function () {
    var parsedValue = Number(guestInput.value);
    render(Number.isFinite(parsedValue) ? parsedValue : minimumGuests, true, true);
  });

  guestRange.addEventListener('input', function () {
    render(Number(guestRange.value), true, true);
  });

  if (decreaseButton) {
    decreaseButton.addEventListener('click', function () {
      var currentValue = Number(guestInput.value);
      render((Number.isFinite(currentValue) ? currentValue : minimumGuests) - 1, true, true);
    });
  }

  if (increaseButton) {
    increaseButton.addEventListener('click', function () {
      var currentValue = Number(guestInput.value);
      render((Number.isFinite(currentValue) ? currentValue : minimumGuests) + 1, true, true);
    });
  }

  durationInputs.forEach(function (input) {
    input.addEventListener('change', function () {
      render(Number(guestInput.value), true, false);
    });
  });

  render(Number(guestInput.value), true, true);
})();
