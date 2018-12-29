const MAP_WIDTH = 500;
const MAP_HEIGHT = 500;

const GAME_TIME_LIMIT = 40000;
const SUDDEN_DEATH_TIME = 20000;

var stage = new createjs.Stage("tanksCanvas");
stage.updatableObjects = [];
var startText;
var timeText;
var endText;

var bg;


var currentGameTime = 0;
var startTimestamp;

var bgIm = new Image();	

var greenWorker;
var brownWorker;
//controlls that the script wants to use.
var scriptControlls = {0:{}, 1:{}};
//a Proxy handler to give default value 0 to non-existing properties
var handler = {
	get: function(target, name) {
	  	return target.hasOwnProperty(name) ? target[name] : 0;
	}
};


var tankBrown,tankGreen;
var bulletsBrown = [];
var bulletsGreen = [];


var gameStatus = 0;
//0 = not started
//1 = started
//2 = ended
	
	//tank brown
var KEYCODE_LEFT = 37, 
	KEYCODE_RIGHT = 39,
	KEYCODE_UP = 38, 
	KEYCODE_DOWN = 40,	
	KEYCODE_SHOOT = 76,  // L to shoot
	KEYCODE_CLEFT = 186, // ; to rotate left
	KEYCODE_CRIGHT = 222, //	' to rotate right	
	//tank green
	KEYCODE_LEFT2 = 68, //
	KEYCODE_RIGHT2 = 71,
	KEYCODE_UP2 = 82, 
	KEYCODE_DOWN2 = 70,	
	KEYCODE_SHOOT2 = 81,  // L to shoot
	KEYCODE_CLEFT2 = 87, // ; to rotate left
	KEYCODE_CRIGHT2 = 69; //	' to rotate right	

	var keys = {37:0,
		39:0,
		38:0, 
		40:0,	
		76:0,
		186:0,
		222:0,
		//tank green
		68:0,
		71:0,
		82:0,
		70:0,
		81:0,
		87:0,
		69:0	
	};

	var script_keys = {0:0,
		1:0,
		2:0, 
		3:0,	
		4:0,
		5:0,
		6:0,
		//tank green
		7:0,
		8:0,
		9:0,
		10:0,
		11:0,
		12:0,
		13:0	
	};

	document.addEventListener('keydown', function(e){
		keys[e.which] = 1;
	});
	document.addEventListener('keyup', function(e){
		keys[e.which] = 0;
	});	
	
 function Main() {
	 createjs.Ticker.timingMode = createjs.Ticker.RAF;
     createjs.Ticker.addEventListener("tick", stage);
	 createjs.Ticker.on("tick", tick);
	 createjs.Ticker.framerate = 30;
	 
	 
     // welcome text
	startText = new createjs.Text("Click to start the game!", "20px Arial", "#000000");
	startText.x = 140;
	startText.y=250;
	startText.textBaseline = "alphabetic";
	stage.addChild(startText);
	
	
	// welcome text
	timeText = new createjs.Text("Game time: "+Math.round(GAME_TIME_LIMIT/10.0)/100.0, "16px Arial", "#000000");
	timeText.x = 40;
	timeText.y=520;
	timeText.textBaseline = "alphabetic";
	stage.addChild(timeText);

	/*Background Image*/

	bgIm.src = "snow.jpg";
	bgIm.onload = function(){
	 var image = event.target;
	 var bg = new createjs.Shape();
     bg.graphics.beginBitmapFill(image, 'repeat');
     bg.graphics.drawRect(0,0,MAP_WIDTH,MAP_HEIGHT);
	 stage.addChild(bg);
	 stage.setChildIndex(bg,0);
	 stage.update();
	}
	
	
	/*tank*/
	var randx = Math.round(Math.random())*400+50; 
	var randy = Math.floor(50+Math.random() * 400);
	tankBrown = new Tank(stage,"tankBrown.png","cannonBrown.png",randx,randy);
	tankGreen = new Tank(stage,"tankGreen.png","cannonGreen.png",(400+randx)%800,500-randy);
	
	console.log("myTank.x,myTank.y,myTank.rotation,myTank.cannonRotation,myTank.velocityX,myTank.velocityY,myTank.accelerationX,myTank.accelerationY,myTank.shootCooldown,myTank.controls.turnLeft,myTank.controls.turnRight,myTank.controls.goForward,myTank.controls.goBack,myTank.controls.shoot,myTank.controls.cannonLeft,myTank.controls.cannonRight,myBullet1.x,myBullet1.y,myBullet1.velocityX,myBullet1.velocityY,myBullet2.x,myBullet2.y,myBullet2.velocityX,myBullet2.velocityY,myBullet3.x,myBullet3.y,myBullet3.velocityX,myBullet3.velocityY,enemyTank.x,enemyTank.y,enemyTank.rotation,enemyTank.cannonRotation,enemyTank.velocityX,enemyTank.velocityY,enemyTank.accelerationX,enemyTank.accelerationY,enemyTank.shootCooldown,enemyBullet1.x,enemyBullet1.y,enemyBullet1.velocityX,enemyBullet1.velocityY,enemyBullet2.x,enemyBullet2.y,enemyBullet2.velocityX,enemyBullet2.velocityY,enemyBullet3.x,enemyBullet3.y,enemyBullet3.velocityX,enemyBullet3.velocityY,currentGameTime");
	stage.update();

  }

function tick(event) { 
	
	if (gameStatus == 1){
		//time refresh
		currentGameTime = Date.now()-startTimestamp;
		timeText.text = "Game time: "+Math.max(0.00,Math.round((GAME_TIME_LIMIT-currentGameTime)/10.0)/100.0);

		//sudden death time
		if(currentGameTime>=SUDDEN_DEATH_TIME){
			rearmTanks(tankBrown,tankGreen);
		}

		//end time - the middle tank wins
		if(currentGameTime>=GAME_TIME_LIMIT){
			if (getTankNearestToMiddle(tankBrown, tankGreen) == null) {
				endGame(null);
			} else {
				endGame(tankBrown === getTankNearestToMiddle(tankBrown,tankGreen) ? tankGreen.type : tankBrown.type);
			}			
		}

		//controll brown tank by keys or with script
		if(document.getElementById("controll-brown").checked) {
			var ctrl = new Proxy(scriptControlls[0], handler); //proxy all not set properties to default value of "0"
			tankBrown.controlTank(ctrl.goForward - ctrl.goBack,ctrl.turnLeft - ctrl.turnRight,ctrl.shoot,ctrl.cannonLeft - ctrl.cannonRight);
			
			script_keys[0] = ctrl.turnLeft;
			script_keys[1] = ctrl.turnRight;
			script_keys[2] = ctrl.goForward;
			script_keys[3] = ctrl.goBack;
			script_keys[4] = ctrl.shoot;
			script_keys[5] = ctrl.cannonLeft;
			script_keys[6] = ctrl.cannonRight;
		} else {
			tankBrown.controlTank(keys[KEYCODE_UP]-keys[KEYCODE_DOWN],keys[KEYCODE_LEFT]-keys[KEYCODE_RIGHT],keys[KEYCODE_SHOOT],keys[KEYCODE_CLEFT]-keys[KEYCODE_CRIGHT]);
		}
		
		//controll green tank by keys or with script
		if(document.getElementById("controll-green").checked) {
			var ctrl = new Proxy(scriptControlls[1], handler); //proxy all not set properties to default value of "0"
			tankGreen.controlTank(ctrl.goForward - ctrl.goBack,ctrl.turnLeft - ctrl.turnRight,ctrl.shoot,ctrl.cannonLeft - ctrl.cannonRight);

			script_keys[7] = ctrl.turnLeft;
			script_keys[8] = ctrl.turnRight;
			script_keys[9] = ctrl.goForward;
			script_keys[10] = ctrl.goBack;
			script_keys[11] = ctrl.shoot;
			script_keys[12] = ctrl.cannonLeft;
			script_keys[13] = ctrl.cannonRight;
		} else {
			tankGreen.controlTank(keys[KEYCODE_UP2]-keys[KEYCODE_DOWN2],keys[KEYCODE_LEFT2]-keys[KEYCODE_RIGHT2],keys[KEYCODE_SHOOT2],keys[KEYCODE_CLEFT2]-keys[KEYCODE_CRIGHT2]);

		}
		//printParameters(tankBrown,tankGreen);
		if (tankBrown.shootCooldown>0) { tankBrown.shootCooldown--; }
		if (tankGreen.shootCooldown>0) { tankGreen.shootCooldown--; }
		

		stage.updatableObjects.forEach(function(object) {
			//update object
			object.updateSpeed();
			
			//remove bullet if out of bounds
			if (object instanceof Bullet) {
				if (object.bitmap.x>MAP_WIDTH || object.bitmap.y>MAP_HEIGHT || object.bitmap.x<0 || object.bitmap.y<0){
					tankBrown.updateBulletList(MAP_WIDTH,MAP_HEIGHT);		
					tankGreen.updateBulletList(MAP_WIDTH,MAP_HEIGHT);	
					object.remove();
				}
			}
			bulletsBrown = tankBrown.bulletList;
			bulletsGreen = tankGreen.bulletList;
			//check for bullet-tank collision
			if (object instanceof Tank){
				stage.updatableObjects.forEach(function(object2) {
					if (object2 instanceof Bullet && object2.type != object.type){
						if ((Math.abs(object2.bitmap.x - object.bitmap.x) <= 16) && (Math.abs(object2.bitmap.y - object.bitmap.y) <= 16)){
							object.remove();
							object2.remove();
							endGame(object.type);
						}
					}
				});
			}
		});
		
		var paramsGreen = greenWorker ? getParams(tankGreen, tankBrown, bulletsGreen, bulletsBrown) : null;
		var paramsBrown = brownWorker ? getParams(tankBrown, tankGreen, bulletsBrown, bulletsGreen) : null;
		if (greenWorker) greenWorker.postMessage(paramsGreen);
		if (brownWorker) brownWorker.postMessage(paramsBrown);
		stage.update(event);
		printParameters(tankBrown,tankGreen,bulletsBrown,bulletsGreen);
	} 
}

function startGame(){
	if (gameStatus==0) { 
		gameStatus =1; 
		startTimestamp = Date.now();
		stage.removeChild(startText);
	

		// set green tank to be controlled by script
		if (document.getElementById("controll-green").checked) {
			var blobURL = URL.createObjectURL( new Blob([
				'(function(){self.onmessage = ',
				document.getElementById("green-script").value,
				'})()' 
			], { type: 'application/javascript' }));
			greenWorker = new Worker(blobURL);
			greenWorker.onmessage = function(e){
				//console.log("Green worker reply:");
				//console.log(e);
				setControlls(1, e.data);
			}
		}

		// set brown tank to be controlled by script
		if (document.getElementById("controll-brown").checked) {
			var blobURL = URL.createObjectURL( new Blob([
				'(function(){self.onmessage = ',
				document.getElementById("brown-script").value,
				'})()' 
			], { type: 'application/javascript' }));
			brownWorker = new Worker(blobURL);
			brownWorker.onmessage = function(e){
				//console.log("Brown worker reply:");
				//console.log(e);
				setControlls(0, e.data);
			}
		}

	} else {
		restartGame();
	}
}

function endGame(playerDead){
	gameStatus = 2;
	if (playerDead === null) {
		endText = new createjs.Text("Game Over! Game ends in a draw! \nClick to restart the game.", "20px Arial", "#000000");
	} else {
		var winner = playerDead == 0 ? "Green" : "Brown";
		endText = new createjs.Text("Game Over! "+winner+" tank wins! \nClick to restart the game.", "20px Arial", "#000000");
	}
	endText.x = 100;
	endText.y=250;
	endText.textBaseline = "alphabetic";
	stage.addChild(endText);
}

function setControlls(tankType, controlls) {
	scriptControlls[tankType] = controlls;
}

function printParameters(tank, enemyTank, bullets, enemyBullets){
	var data = {};
	data.myTank = {};
	data.myTank.x = tank.bitmap.x;
	data.myTank.y = tank.bitmap.y;
	data.myTank.rotation = (tank.bitmap.rotation+360) % 360;
	data.myTank.cannonRotation = (tank.cannon.bitmap.rotation+360)  % 360;
	data.myTank.velocityX = tank.velocityX;
	data.myTank.velocityY = tank.velocityY;
	data.myTank.accelerationX = tank.accelerationX;
	data.myTank.accelerationY = tank.accelerationY;
	data.myTank.shootCooldown = tank.shootCooldown;
	data.myTank.controls = {};
	if (tank.type == 0) {
		data.myTank.controls.turnLeft = keys[KEYCODE_LEFT] || script_keys[0];
		data.myTank.controls.turnRight = keys[KEYCODE_RIGHT] || script_keys[1];
		data.myTank.controls.goForward = keys[KEYCODE_UP] || script_keys[2];
		data.myTank.controls.goBack = keys[KEYCODE_DOWN] || script_keys[3];
		data.myTank.controls.shoot = keys[KEYCODE_SHOOT] || script_keys[4];
		data.myTank.controls.cannonLeft = keys[KEYCODE_CLEFT] || script_keys[5];
		data.myTank.controls.cannonRight = keys[KEYCODE_CRIGHT] || script_keys[6];
	} else {
		data.myTank.controls.turnLeft = keys[KEYCODE_LEFT] || script_keys[7];
		data.myTank.controls.turnRight = keys[KEYCODE_RIGHT] || script_keys[8];
		data.myTank.controls.goForward = keys[KEYCODE_UP] || script_keys[9];
		data.myTank.controls.goBack = keys[KEYCODE_DOWN] || script_keys[10];
		data.myTank.controls.shoot = keys[KEYCODE_SHOOT] || script_keys[11];
		data.myTank.controls.cannonLeft = keys[KEYCODE_CLEFT] || script_keys[12];
		data.myTank.controls.cannonRight = keys[KEYCODE_CRIGHT] || script_keys[613];
	}
	


	
	data.myTank.bullets = bullets.filter((element)=>(element.bitmap!=null)).map(function(b) {
			return {x: b.bitmap.x, y: b.bitmap.y, velocityX: b.velocityX, velocityY: b.velocityY};
	});

	data.enemyTank = {};
	data.enemyTank.x = enemyTank.bitmap.x;
	data.enemyTank.y = enemyTank.bitmap.y;
	data.enemyTank.rotation = (enemyTank.bitmap.rotation+360)  % 360;
	data.enemyTank.cannonRotation = (enemyTank.cannon.bitmap.rotation+360)  % 360;
	data.enemyTank.velocityX = enemyTank.velocityX;
	data.enemyTank.velocityY = enemyTank.velocityY;
	data.enemyTank.accelerationX = enemyTank.accelerationX;
	data.enemyTank.accelerationY = enemyTank.accelerationY;
	data.enemyTank.shootCooldown = enemyTank.shootCooldown;
	//data.enemyTank.controls = {};
	//data.enemyTank.controls.turnLeft = keys[KEYCODE_LEFT2];
	//data.enemyTank.controls.turnRight = keys[KEYCODE_RIGHT2];
	//data.enemyTank.controls.goForward = keys[KEYCODE_UP2];
	//data.enemyTank.controls.goBack = keys[KEYCODE_DOWN2];
	//data.enemyTank.controls.shoot = keys[KEYCODE_SHOOT2];
	//data.enemyTank.controls.cannonLeft = keys[KEYCODE_CLEFT2];
	//data.enemyTank.controls.cannonRight = keys[KEYCODE_CRIGHT2];
	data.enemyTank.bullets = enemyBullets.filter((element)=>(element.bitmap!=null)).map(function(b) {
		return {x: b.bitmap.x, y: b.bitmap.y, velocityX: b.velocityX, velocityY: b.velocityY};
	});

	data.currentGameTime = currentGameTime;
	
	var dataRow = "";

	dataRow += Math.round(data.myTank.x*1000)/1000+",";
	dataRow += Math.round(data.myTank.y*1000)/1000+",";
	dataRow += Math.round(data.myTank.rotation*1000)/1000+",";
	dataRow+= Math.round(data.myTank.cannonRotation*1000)/1000+",";
	dataRow+= Math.round(data.myTank.velocityX*1000)/1000+",";
	dataRow+= Math.round(data.myTank.velocityY*1000)/1000+",";
	dataRow+= Math.round(data.myTank.accelerationX*1000)/1000+",";
	dataRow+= Math.round(data.myTank.accelerationY*1000)/1000+",";
	dataRow+= data.myTank.shootCooldown+",";
	dataRow+= data.myTank.controls.turnLeft+",";
	dataRow+= data.myTank.controls.turnRight+",";
	dataRow+= data.myTank.controls.goForward+",";
	dataRow+= data.myTank.controls.goBack+",";
	dataRow+= data.myTank.controls.shoot+",";
	dataRow+= data.myTank.controls.cannonLeft+",";
	dataRow+= data.myTank.controls.cannonRight+",";

	if (data.myTank.bullets[0]){
		dataRow+= Math.round(data.myTank.bullets[0].x*1000)/1000+",";
		dataRow+= Math.round(data.myTank.bullets[0].y*1000)/1000+",";
		dataRow+= Math.round(data.myTank.bullets[0].velocityX*1000)/1000+",";
		dataRow+= Math.round(data.myTank.bullets[0].velocityY*1000)/1000+",";
	} else {
		dataRow+= "0,";
		dataRow+= "0,";
		dataRow+= "0,";
		dataRow+= "0,";
	}
	if (data.myTank.bullets[1]){
		dataRow+= Math.round(data.myTank.bullets[1].x*1000)/1000+",";
		dataRow+= Math.round(data.myTank.bullets[1].y*1000)/1000+",";
		dataRow+= Math.round(data.myTank.bullets[1].velocityX*1000)/1000+",";
		dataRow+= Math.round(data.myTank.bullets[1].velocityY*1000)/1000+",";
	} else {
		dataRow+= "0,";
		dataRow+= "0,";
		dataRow+= "0,";
		dataRow+= "0,";
	}
	if (data.myTank.bullets[2]){
		dataRow+= Math.round(data.myTank.bullets[2].x*1000)/1000+",";
		dataRow+= Math.round(data.myTank.bullets[2].y*1000)/1000+",";
		dataRow+= Math.round(data.myTank.bullets[2].velocityX*1000)/1000+",";
		dataRow+= Math.round(data.myTank.bullets[2].velocityY*1000)/1000+",";
	} else {
		dataRow+= "0,";
		dataRow+= "0,";
		dataRow+= "0,";
		dataRow+= "0,";
	}

	dataRow+= Math.round(data.enemyTank.x*1000)/1000+",";
	dataRow+= Math.round(data.enemyTank.y*1000)/1000+",";
	dataRow+= Math.round(data.enemyTank.rotation*1000)/1000+",";
	dataRow+= Math.round(data.enemyTank.cannonRotation*1000)/1000+",";
	dataRow+= Math.round(data.enemyTank.velocityX*1000)/1000+",";
	dataRow+= Math.round(data.enemyTank.velocityY*1000)/1000+",";
	dataRow+= Math.round(data.enemyTank.accelerationX*1000)/1000+",";
	dataRow+= Math.round(data.enemyTank.accelerationY*1000)/1000+",";
	dataRow+= data.enemyTank.shootCooldown+",";
	if (data.enemyTank.bullets[0]){
		dataRow+=  Math.round(data.enemyTank.bullets[0].x*1000)/1000+",";
		dataRow+=  Math.round(data.enemyTank.bullets[0].y*1000)/1000+",";
		dataRow+=  Math.round(data.enemyTank.bullets[0].velocityX*1000)/1000+",";
		dataRow+=  Math.round(data.enemyTank.bullets[0].velocityY*1000)/1000+",";
	} else {
		dataRow+= "0,";
		dataRow+= "0,";
		dataRow+= "0,";
		dataRow+= "0,";
	}
	if (data.enemyTank.bullets[1]){
		dataRow+=  Math.round(data.enemyTank.bullets[1].x*1000)/1000+",";
		dataRow+=  Math.round(data.enemyTank.bullets[1].y*1000)/1000+",";
		dataRow+=  Math.round(data.enemyTank.bullets[1].velocityX*1000)/1000+",";
		dataRow+=  Math.round(data.enemyTank.bullets[1].velocityY*1000)/1000+",";
	} else {
		dataRow+= "0,";
		dataRow+= "0,";
		dataRow+= "0,";
		dataRow+= "0,";
	}
	if (data.enemyTank.bullets[2]){
		dataRow+=  Math.round(data.enemyTank.bullets[2].x*1000)/1000+",";
		dataRow+=  Math.round(data.enemyTank.bullets[2].y*1000)/1000+",";
		dataRow+=  Math.round(data.enemyTank.bullets[2].velocityX*1000)/1000+",";
		dataRow+=  Math.round(data.enemyTank.bullets[2].velocityY*1000)/1000+",";
	} else {
		dataRow+= "0,";
		dataRow+= "0,";
		dataRow+= "0,";
		dataRow+= "0,";
	}
	dataRow+= data.currentGameTime+"\n";
	//document.getElementById("data-logs").value += dataRow;
	console.log(dataRow);

}

function getParams(tank, enemyTank, bullets, enemyBullets){
	var data = {};
	data.myTank = {};
	data.myTank.x = tank.bitmap.x;
	data.myTank.y = tank.bitmap.y;
	data.myTank.rotation = (tank.bitmap.rotation+360)  % 360;
	data.myTank.cannonRotation = (tank.cannon.bitmap.rotation+360)  % 360;
	data.myTank.velocityX = tank.velocityX;
	data.myTank.velocityY = tank.velocityY;
	data.myTank.accelerationX = tank.accelerationX;
	data.myTank.accelerationY = tank.accelerationY;
	data.myTank.shootCooldown = tank.shootCooldown;
	data.myTank.bullets = bullets.filter((element)=>(element.bitmap!=null)).map(function(b) {
		return {x: b.bitmap.x, y: b.bitmap.y, velocityX: b.velocityX, velocityY: b.velocityY};
	});
	
	data.enemyTank = {};
	data.enemyTank.x = enemyTank.bitmap.x;
	data.enemyTank.y = enemyTank.bitmap.y;
	data.enemyTank.rotation = (enemyTank.bitmap.rotation+360)  % 360;
	data.enemyTank.cannonRotation = (enemyTank.cannon.bitmap.rotation+360)  % 360;
	data.enemyTank.velocityX = enemyTank.velocityX;
	data.enemyTank.velocityY = enemyTank.velocityY;
	data.enemyTank.accelerationX = enemyTank.accelerationX;
	data.enemyTank.accelerationY = enemyTank.accelerationY;
	data.enemyTank.shootCooldown = enemyTank.shootCooldown;
	data.enemyTank.bullets = enemyBullets.filter((element)=>(element.bitmap!=null)).map(function(b) {
		return {x: b.bitmap.x, y: b.bitmap.y, velocityX: b.velocityX, velocityY: b.velocityY};
	});
	data.currentGameTime = currentGameTime;

	var brownTank = data.myTank;
	var greenTank = data.enemyTank;
	if (tank.type === 1) {
		brownTank = data.enemyTank;
		greenTank = data.myTank;
	}

	brownTank.controls = {};
	if(document.getElementById("controll-brown").checked) {
		brownTank.controls.turnLeft = script_keys[0];
		brownTank.controls.turnRight = script_keys[1];
		brownTank.controls.goForward = script_keys[2];
		brownTank.controls.goBack = script_keys[3];
		brownTank.controls.shoot = script_keys[4]; 
		brownTank.controls.cannonLeft = script_keys[5];
		brownTank.controls.cannonRight = script_keys[6];
	} else {
		brownTank.controls.turnLeft = keys[KEYCODE_LEFT];
		brownTank.controls.turnRight = keys[KEYCODE_RIGHT];
		brownTank.controls.goForward = keys[KEYCODE_UP];
		brownTank.controls.goBack = keys[KEYCODE_DOWN];
		brownTank.controls.shoot = keys[KEYCODE_SHOOT]; 
		brownTank.controls.cannonLeft = keys[KEYCODE_CLEFT];
		brownTank.controls.cannonRight = keys[KEYCODE_CRIGHT];
	}
	greenTank.controls = {};
	if(document.getElementById("controll-green").checked) {
		greenTank.controls.turnLeft = script_keys[7];
		greenTank.controls.turnRight = script_keys[8];
		greenTank.controls.goForward = script_keys[9];
		greenTank.controls.goBack = script_keys[10];
		greenTank.controls.shoot = script_keys[11];
		greenTank.controls.cannonLeft = script_keys[12];
		greenTank.controls.cannonRight = script_keys[13];
	} else {
		greenTank.controls.turnLeft = keys[KEYCODE_LEFT2];
		greenTank.controls.turnRight = keys[KEYCODE_RIGHT2];
		greenTank.controls.goForward = keys[KEYCODE_UP2];
		greenTank.controls.goBack = keys[KEYCODE_DOWN2];
		greenTank.controls.shoot = keys[KEYCODE_SHOOT2];
		greenTank.controls.cannonLeft = keys[KEYCODE_CLEFT2];
		greenTank.controls.cannonRight = keys[KEYCODE_CRIGHT2];
	}
	return data;
}

function getTankNearestToMiddle(tank1, tank2) {
	var distTank1 = Math.sqrt(
			Math.pow((tank1.bitmap.x - MAP_WIDTH / 2), 2) + 
			Math.pow((tank1.bitmap.y - MAP_HEIGHT / 2), 2)
		);
	var distTank2 = Math.sqrt(
			Math.pow((tank2.bitmap.x - MAP_WIDTH / 2), 2) + 
			Math.pow((tank2.bitmap.y - MAP_HEIGHT / 2), 2)
		);
	if (distTank1 > distTank2) {
		return tank2;
	}
	if (distTank2 > distTank1) {
		return tank1;
	}
	return null;
}


/**
 * function will boost one tank (nearer to the middle) and reset the second one to base values
 * @param Tank tank1 
 * @param Tank tank2 
 */
function rearmTanks(tank1, tank2) {
	var tankMiddle = getTankNearestToMiddle(tank1, tank2);
	if (tankMiddle == null) {
		tank1.maxCooldown = 100;
		tank2.maxCooldown = 100;
	} else {
		var tankFarAway = tankMiddle === tank1 ? tank2 : tank1;
		tankMiddle.maxCooldown = 50;
		tankFarAway.maxCooldown = 100;
	}
}

function restartGame(){
	if (gameStatus==2) { //gameEnded
		greenWorker=null;
		brownWorker=null;
		stage.removeChild(endText);
		stage.updatableObjects.forEach(function(object) {
			object.removeDirect();
		});
		
		bulletsBrown = [];
		bulletsGreen = [];
		stage.updatableObjects = [];
		scriptControlls = {0:{}, 1:{}};
		script_keys = {0:0,
			1:0,
			2:0, 
			3:0,	
			4:0,
			5:0,
			6:0,
			//tank green
			7:0,
			8:0,
			9:0,
			10:0,
			11:0,
			12:0,
			13:0	
		};
		if (document.getElementById("controll-green").checked) {
			var blobURL = URL.createObjectURL( new Blob([
				'(function(){self.onmessage = ',
				document.getElementById("green-script").value,
				'})()' 
			], { type: 'application/javascript' }));
			greenWorker = new Worker(blobURL);
			greenWorker.onmessage = function(e){
				//console.log("Green worker reply:");
				//console.log(e);
				setControlls(1, e.data);
			}
		}
	
		// set brown tank to be controlled by script
		if (document.getElementById("controll-brown").checked) {
			var blobURL = URL.createObjectURL( new Blob([
				'(function(){self.onmessage = ',
				document.getElementById("brown-script").value,
				'})()' 
			], { type: 'application/javascript' }));
			brownWorker = new Worker(blobURL);
			brownWorker.onmessage = function(e){
				//console.log("Brown worker reply:");
				//console.log(e);
				setControlls(0, e.data);
			}
		}
	
		var randx = Math.round(Math.random())*400+50; 
		var randy = Math.floor(50+Math.random() * 400);
		tankBrown = new Tank(stage,"tankBrown.png","cannonBrown.png",randx,randy);
		tankGreen = new Tank(stage,"tankGreen.png","cannonGreen.png",(400+randx)%800,500-randy);
		currentGameTime = 0;
		startTimestamp = Date.now();
		gameStatus =1; 
		stage.update();
	}
}