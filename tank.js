class Tank {
	
	constructor(stage, imageTankSource, imageCannonSource,startX,startY){
		if (imageTankSource.includes("Brown")) {
			this.type = 0;
		} else {
			this.type = 1;
		}
		this.stage = stage;
		this.startX = startX;
		this.startY = startY;
		this.image = new Image();	
		this.image.src = imageTankSource;	
		this.image.parent = this;
		this.image.onload = this.loadTank;
		this.imageCannonSource = imageCannonSource;
		this.velocity = 0;
		this.velocityX = 0;
		this.velocityY = 0;
		this.acceleration = 0;
		this.accelerationX = 0;
		this.accelerationY = 0;
		this.shootCooldown = 0;
		this.maxCooldown = 100;
		this.bulletList = [];
	
	}
	
	loadTank(event) {
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
		this.parent.stage.updatableObjects.push(this.parent);
		
		//this.parent.stage.setChildIndex(this.parent.bitmap,10+this.parent.type);
		this.parent.cannon = new Cannon(this.parent.stage, this.parent.imageCannonSource,this.parent.startX,this.parent.startY);
		this.parent.stage.update();
	}
	

	
	controlTank(acceleration,direction,shoot,cannonDirection){
		if (direction>0){
			this.bitmap.rotation -= 1.5;
			this.cannon.bitmap.rotation -= 1.5;
		} else if (direction<0){
			this.bitmap.rotation += 1.5;
			this.cannon.bitmap.rotation += 1.5;
		}
		if (acceleration>0){
			this.acceleration = 0.05;
			this.accelerationX = this.acceleration*Math.cos(this.bitmap.rotation*Math.PI/180);
			this.accelerationY = this.acceleration*Math.sin(this.bitmap.rotation*Math.PI/180);
			
		} else if (acceleration<0) {
			this.acceleration = 0.05;
			this.accelerationX = this.acceleration*Math.cos((this.bitmap.rotation+180)*Math.PI/180);
			this.accelerationY = this.acceleration*Math.sin((this.bitmap.rotation+180)*Math.PI/180);
		}	else {
			this.acceleration = 0;
			this.accelerationX = 0;
			this.accelerationY = 0;
		}	
		if (cannonDirection>0){
			this.cannon.bitmap.rotation -= 1.5;
		} else if (cannonDirection<0){
			this.cannon.bitmap.rotation += 1.5;
		}
		if (shoot==1 && this.shootCooldown==0){
			this.shootCooldown=this.maxCooldown;
			var bullet;
			if (this.type == 0){				
				bullet = new Bullet(this.stage,"bulletBrown.png",this.bitmap.x+21*Math.cos(this.cannon.bitmap.rotation*Math.PI/180),this.bitmap.y+21*Math.sin(this.cannon.bitmap.rotation*Math.PI/180),this.cannon.bitmap.rotation);
			} else {
				bullet = new Bullet(this.stage,"bulletGreen.png",this.bitmap.x+21*Math.cos(this.cannon.bitmap.rotation*Math.PI/180),this.bitmap.y+21*Math.sin(this.cannon.bitmap.rotation*Math.PI/180),this.cannon.bitmap.rotation);
			}
			this.bulletList.push(bullet);
			
		}
		
	}
	
	updateBulletList(width,height){
		this.bulletList = this.bulletList.filter((object)=>(object.bitmap!=null && object.bitmap.x<=width && object.bitmap.y<=height && object.bitmap.x>=0 && object.bitmap.y>=0));
		
	}

	updateSpeed(){
		this.velocity += this.acceleration;
		this.velocityX += this.accelerationX;
		this.velocityY += this.accelerationY;
		
		this.velocity *= 0.95;
		this.velocityX *= 0.95;
		this.velocityY *= 0.95;
		
		if (this.velocity>=15) {
			this.velocity = 15;
		} else if (this.velocity<=-15) {
			this.velocity = -15;
		} 
		
		if (this.bitmap.x+this.velocityX+15<MAP_WIDTH && this.bitmap.y+this.velocityY+15<MAP_HEIGHT && this.bitmap.x-15+this.velocityX>0 && this.bitmap.y-15+this.velocityY>0){
			this.bitmap.x += this.velocityX;
			this.bitmap.y += this.velocityY;
			this.cannon.bitmap.x += this.velocityX;
			this.cannon.bitmap.y += this.velocityY;
		}
	}
	
	remove(){
		var index = this.stage.updatableObjects.indexOf(this);
		if (index > -1) {
			this.stage.updatableObjects.splice(index, 1);
		}
		this.stage.removeChild(this.bitmap);
		this.stage.removeChild(this.cannon.bitmap);
	}

	removeDirect(){
		this.stage.removeChild(this.bitmap);
		this.stage.removeChild(this.cannon.bitmap);
	}
}
