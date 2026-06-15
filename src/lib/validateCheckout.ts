export const POC_TEST_CARD = "4242424242424242";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCardNumber(value: string): string {
  const digits = digitsOnly(value).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiration(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function validateCheckoutFields(fields: {
  cardNumber: string;
  expiration: string;
  cvc: string;
  zip: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const cardDigits = digitsOnly(fields.cardNumber);
  const expDigits = digitsOnly(fields.expiration);
  const cvcDigits = digitsOnly(fields.cvc);
  const zipDigits = digitsOnly(fields.zip);

  if (!cardDigits) {
    errors.cardNumber = "Card number is required.";
  } else if (cardDigits.length !== 16) {
    errors.cardNumber = "Enter a 16-digit card number.";
  } else if (cardDigits !== POC_TEST_CARD) {
    errors.cardNumber = "Use test card 4242 4242 4242 4242 for this demo.";
  }

  if (!expDigits) {
    errors.expiration = "Expiration is required.";
  } else if (expDigits.length !== 4) {
    errors.expiration = "Use MM/YY format.";
  } else {
    const month = Number(expDigits.slice(0, 2));
    const year = 2000 + Number(expDigits.slice(2, 4));
    if (month < 1 || month > 12) {
      errors.expiration = "Enter a valid month (01–12).";
    } else {
      const now = new Date();
      const expEnd = new Date(year, month, 0, 23, 59, 59);
      if (expEnd < now) {
        errors.expiration = "This card appears expired.";
      }
    }
  }

  if (!cvcDigits) {
    errors.cvc = "CVC is required.";
  } else if (cvcDigits.length < 3 || cvcDigits.length > 4) {
    errors.cvc = "Enter a 3 or 4 digit CVC.";
  }

  if (!zipDigits) {
    errors.zip = "ZIP code is required.";
  } else if (zipDigits.length < 5) {
    errors.zip = "Enter a valid ZIP code.";
  }

  return errors;
}

export function simulateCheckoutDelay(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 1200);
  });
}
