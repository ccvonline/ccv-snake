
function Button( canvasCTX, bgColor, borderWidth, borderColor, label, fontName, fontSize, fontColor ) {
    
    this.canvasCTX = canvasCTX;

    // x/y can be set by the caller later
    this.x = 0;
    this.y = 0;

    this.fillColor = bgColor;

    this.borderWidth = borderWidth;
    this.borderColor = borderColor;
    
    // set the label and font
    this.label = label;
    this.fontName = fontName;
    this.fontSize = fontSize;
    this.fontColor = fontColor;

    // measure the font and set the button's width / height to wrap around the label
    let currFont = this.canvasCTX.font;
    let currTextAlign = this.canvasCTX.textAlign;

    // first SET the font so we can measure and fit the button around it
    this.canvasCTX.font = `${this.fontSize} ${this.fontName}`;
    this.canvasCTX.textAlign = "left";

    this.fontWidth = this.canvasCTX.measureText(this.label).width; 
    this.fontHeightObj = getTextHeight(this.canvasCTX.font, this.fontSize);
    
    // make the button a little larger than the label
    this.width = this.fontWidth * 1.25;
    this.height = this.fontHeightObj.height * 1.25;

    // restore original values
    this.canvasCTX.textAlign = currTextAlign;
    this.canvasCTX.font = currFont;
}

Button.prototype.render = function( ) {
    
    // store current values
    let currFillStyle = this.canvasCTX.fillStyle;
    let currStrokeStyle = this.canvasCTX.strokeStyle;
    let currLineWidth = this.canvasCTX.lineWidth;
    let currFont = this.canvasCTX.font;
    let currTextAlign = this.canvasCTX.textAlign;
        
    // render the background
    this.canvasCTX.fillStyle = this.fillColor;
    this.canvasCTX.fillRect( this.x, this.y, this.width, this.height);
    
    // render the border
    this.canvasCTX.lineWidth = this.borderWidth;
    this.canvasCTX.strokeStyle = this.borderColor;
    this.canvasCTX.strokeRect( this.x, this.y, this.width, this.height);

    // set the font and render the label centered in the button
    this.canvasCTX.font = `${this.fontSize} ${this.fontName}`;
    this.canvasCTX.textAlign = "left";
    let labelXOffset = (this.width - this.fontWidth) / 2;
    let labelYOffset = (this.height - this.fontHeightObj.height) / 2;

    this.canvasCTX.fillStyle = this.fontColor;
    this.canvasCTX.fillText( this.label, this.x + labelXOffset, this.y + (this.height - labelYOffset));

    // restore original values
    this.canvasCTX.textAlign = currTextAlign;
    this.canvasCTX.font = currFont;
    this.canvasCTX.fillStyle = currFillStyle;
    this.canvasCTX.strokeStyle = currStrokeStyle;
    this.canvasCTX.currLineWidth = currLineWidth;
}

Button.prototype.wasClicked = function( mouseClickEvt ) {
    if( mouseClickEvt.clicked ) {
        //see if the point was inside the button rect

        // make sure the mouse point that was clicked was greater than the left edge of the button and less than the right edge
        // and make sure it was greater than the top edge and less than the button edge.
        if( mouseClickEvt.x > this.x && mouseClickEvt.x < (this.x + this.width) && 
            mouseClickEvt.y > this.y && mouseClickEvt.y < (this.y + this.height) ) {
                return true;
            }
    }

    return false;
}
