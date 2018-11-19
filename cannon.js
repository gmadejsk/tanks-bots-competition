class Cannon {

	constructor(stage, imageCannonSource,startX,startY){
		if (imageCannonSource.includes("Brown")) {
			this.type = 0;
		} else {
			this.type = 1;
		}
		this.stage = stage;
		this.startX = startX;
		this.startY = startY;
		this.image = new Image();	
		this.image.src = imageCannonSource;	
		this.image.parent = this;
		this.image.onload = this.loadCannon;
	
	}
	
	
	loadCannon(event) {
		var image = event.target;
		this.parent.bitmap = new createjs.Bitmap(image);
		this.parent.bitmap.x = this.parent.startX;
		this.parent.bitmap.y = this.parent.startY;
		this.parent.bitmap.regX = 15;
		this.parent.bitmap.regY = 15;
		if (this.parent.startX>250){
			this.parent.bitmap.rotation = 180;
		} else {
			this.parent.bitmap.rotation = 0;
		}
		this.parent.stage.addChild(this.parent.bitmap);
		//this.parent.stage.setChildIndex(this.parent.bitmap,20+this.parent.type);
		this.parent.stage.update();

	}
}