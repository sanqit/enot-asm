const selectLine = (element, selectedLine: number) => {
  if (selectedLine >= 0) {
    var lines = element.value.split("\n");

    // Calculate start/end
    var startPos = 0;
    for (var x = 0; x < lines.length; x++) {
      if (x === selectedLine) {
        break;
      }
      startPos += lines[x].length + 1;
    }

    var endPos = lines[selectedLine].length + startPos;

    // Chrome / Firefox
    if (typeof element.selectionStart !== undefined) {
      element.focus();
      element.selectionStart = startPos;
      element.selectionEnd = endPos;
    }

    // IE
    if (document.selection && document.selection.createRange) {
      element.focus();
      element.select();
      var range = document.selection.createRange();
      range.collapse(true);
      range.moveEnd("character", endPos);
      range.moveStart("character", startPos);
      range.select();
    }
  }
};

export default selectLine;
