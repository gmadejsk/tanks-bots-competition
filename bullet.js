class Bullet {
	
	constructor(stage, imageBulletSource, startX,startY, direction){
		if (imageBulletSource.includes("Brown")) {
			this.type = 0;
		} else {
			this.type = 1;
		}
		this.stage = stage;
		this.direction = direction;
		this.startX = startX;
		this.startY = startY;
		this.image = new Image();	
		this.image.src = imageBulletSource;	
		this.image.parent = this;
		this.image.onload = this.loadBullet;
		this.velocity = 2.5;
		this.velocityX = 0;
		this.velocityY = 0;
		this.shootCooldown = 0;
	
	}
	
	loadBullet(event) {
		var image = event.target;
		this.parent.bitmap = new createjs.Bitmap(image);
		this.parent.bitmap.x = this.parent.startX;
		this.parent.bitmap.y = this.parent.startY;
		this.parent.bitmap.regX = 16;
		this.parent.bitmap.regY = 16;
		this.parent.stage.addChild(this.parent.bitmap);
		this.parent.stage.updatableObjects.push(this.parent);
		
		//this.parent.stage.setChildIndex(this.parent.bitmap,30+this.parent.type);
		this.parent.velocityX = this.parent.velocity*Math.cos(this.parent.direction*Math.PI/180);
		this.parent.velocityY = this.parent.velocity*Math.sin(this.parent.direction*Math.PI/180);
		this.parent.stage.update();
	}
	
	updateSpeed(){
		this.bitmap.x += this.velocityX;
		this.bitmap.y += this.velocityY;
	}
	
	remove(){
		var index = this.stage.updatableObjects.indexOf(this);
		if (index > -1) {
			this.stage.updatableObjects.splice(index, 1);
		}
		this.stage.removeChild(this.bitmap);
	}
	removeDirect(){
		this.stage.removeChild(this.bitmap);
	}
}
