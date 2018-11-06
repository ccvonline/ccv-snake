
// Given a font and size, this will return the font measurements for it.
var getTextHeight = function(font, fontSize) {

    var text = $('<span>Hg</span>').css("font-family", font );
    var text = $('<span>Hg</span>').css("font-size", fontSize );
    var block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>');
  
    var div = $('<div></div>');
    div.append(text, block);
  
    var body = $('body');
    body.append(div);
  
    try {
  
      var result = {};
  
      block.css({ verticalAlign: 'baseline' });
      result.ascent = block.offset().top - text.offset().top;
  
      block.css({ verticalAlign: 'bottom' });
      result.height = block.offset().top - text.offset().top;
  
      result.descent = result.height - result.ascent;
  
    } 
    finally {
      div.remove();
    }
  
    return result;
};