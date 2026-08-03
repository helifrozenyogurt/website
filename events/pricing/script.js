(function () {
  var guestInput = document.getElementById('guestCountCalculator');
  var guestRange = document.getElementById('guestRange');
  var decreaseButton = document.getElementById('decreaseGuests');
  var increaseButton = document.getElementById('increaseGuests');
  var packageResult = document.getElementById('packageResult');
  var totalResult = document.getElementById('totalResult');

  if (!guestInput || !guestRange || !packageResult || !totalResult) {
    return;
  }

  var minimumGuests = 20;
  var maximumGuests = 75;
  var setupFee = 300;
  var pricePerGuest = 9;

  function clampGuestCount(value) {
    return Math.min(maximumGuests, Math.max(minimumGuests, Math.round(value)));
  }

  function packageForGuests(guestCount) {
    if (guestCount <= 30) {
      return 'Heli Mini · 60 minutes';
    }
    if (guestCount <= 50) {
      return 'Heli Celebration · 90 minutes';
    }
    return 'Heli Signature · 2 hours';
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }

  function render(guestCount, synchronizeInput) {
    var normalizedCount = clampGuestCount(guestCount);

    if (synchronizeInput) {
      guestInput.value = String(normalizedCount);
    }
    guestRange.value = String(normalizedCount);
    packageResult.textContent = packageForGuests(normalizedCount);
    totalResult.textContent = formatCurrency(setupFee + (pricePerGuest * normalizedCount));

    if (decreaseButton) {
      decreaseButton.disabled = normalizedCount <= minimumGuests;
    }
    if (increaseButton) {
      increaseButton.disabled = normalizedCount >= maximumGuests;
    }
  }

  guestInput.addEventListener('input', function () {
    var parsedValue = Number(guestInput.value);
    if (Number.isFinite(parsedValue)) {
      render(parsedValue, false);
    }
  });

  guestInput.addEventListener('change', function () {
    var parsedValue = Number(guestInput.value);
    render(Number.isFinite(parsedValue) ? parsedValue : minimumGuests, true);
  });

  guestRange.addEventListener('input', function () {
    render(Number(guestRange.value), true);
  });

  if (decreaseButton) {
    decreaseButton.addEventListener('click', function () {
      var currentValue = Number(guestInput.value);
      render((Number.isFinite(currentValue) ? currentValue : minimumGuests) - 1, true);
    });
  }

  if (increaseButton) {
    increaseButton.addEventListener('click', function () {
      var currentValue = Number(guestInput.value);
      render((Number.isFinite(currentValue) ? currentValue : minimumGuests) + 1, true);
    });
  }

  render(Number(guestInput.value), true);
})();
