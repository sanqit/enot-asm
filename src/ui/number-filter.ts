const numberFilter = (input: number, isHex: boolean) => {
  if (isHex) {
    var hex = input.toString(16).toUpperCase();
    return hex.length === 1 ? "0" + hex : hex;
  } else {
    return input.toString(10);
  }
};

export default numberFilter;
