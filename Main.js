const MAP_WIDTH = 500;
const MAP_HEIGHT = 500;

const GAME_TIME_LIMIT = 40000;
const SUDDEN_DEATH_TIME = 20000;

var stage = new createjs.Stage("tanksCanvas");
stage.updatableObjects = [];
var startText;
var timeText;

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
				endGame(tankBrown === getTankNearestToMiddle(tankBrown,tankGreen) ? tankGreen : tankBrown);
			}			
		}

		//controll brown tank by keys or with script
		if(document.getElementById("controll-brown").checked) {
			var ctrl = new Proxy(scriptControlls[0], handler); //proxy all not set properties to default value of "0"
			tankBrown.controlTank(ctrl.up - ctrl.down,ctrl.left - ctrl.right,ctrl.shoot,ctrl.cannonLeft - ctrl.cannonRight);
		} else {
			tankBrown.controlTank(keys[KEYCODE_UP]-keys[KEYCODE_DOWN],keys[KEYCODE_LEFT]-keys[KEYCODE_RIGHT],keys[KEYCODE_SHOOT],keys[KEYCODE_CLEFT]-keys[KEYCODE_CRIGHT]);
		}
		
		//controll green tank by keys or with script
		if(document.getElementById("controll-green").checked) {
			var ctrl = new Proxy(scriptControlls[1], handler); //proxy all not set properties to default value of "0"
			tankGreen.controlTank(ctrl.up - ctrl.down,ctrl.left - ctrl.right,ctrl.shoot,ctrl.cannonLeft - ctrl.cannonRight);
		} else {
			tankGreen.controlTank(keys[KEYCODE_UP2]-keys[KEYCODE_DOWN2],keys[KEYCODE_LEFT2]-keys[KEYCODE_RIGHT2],keys[KEYCODE_SHOOT2],keys[KEYCODE_CLEFT2]-keys[KEYCODE_CRIGHT2]);
		}
		//printParameters(tankBrown,tankGreen);
		if (tankBrown.shootCooldown>0) { tankBrown.shootCooldown--; }
		if (tankGreen.shootCooldown>0) { tankGreen.shootCooldown--; }
		
		var bulletsBrown = [];
		var bulletsGreen = [];
		stage.updatableObjects.forEach(function(object) {
			//update object
			object.updateSpeed();
			
			//remove bullet if out of bounds
			if (object instanceof Bullet) {
				if (object.bitmap.x>MAP_WIDTH || object.bitmap.y>MAP_HEIGHT || object.bitmap.x<0 || object.bitmap.y<0){
					object.remove();
				} else {
					if(object.type === 0) {
						bulletsBrown.push(object);
					} else {
						bulletsGreen.push(object);
					}
				}
			}
			
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
	} 
}

function startGame(){
	if (gameStatus==0) { 
		gameStatus =1; 
		startTimestamp = Date.now();
		stage.removeChild(startText);
	}

	// set green tank to be controlled by script
 	if (document.getElementById("controll-green").checked) {
		var blobURL = URL.createObjectURL( new Blob([
			'(function(){self.onmessage = ',
			document.getElementById("green-script").value,
			'})()' 
		], { type: 'application/javascript' }));
		greenWorker = new Worker(blobURL);
		greenWorker.onmessage = function(e){
			console.log("Green worker reply:");
			console.log(e);
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
			console.log("Brown worker reply:");
			console.log(e);
			setControlls(0, e.data);
		}
	}
}

function endGame(playerDead){
	gameStatus = 2;
	var text;
	if (playerDead === null) {
		text = new createjs.Text("Game Over! Game ends in a draw!", "20px Arial", "#000000");
	} else {
		var winner = playerDead == 0 ? "Green" : "Brown";
		text = new createjs.Text("Game Over! "+winner+" tank wins!", "20px Arial", "#000000");
	}
	text.x = 100;
	text.y=250;
	text.textBaseline = "alphabetic";
	stage.addChild(text);
}

function setControlls(tankType, controlls) {
	scriptControlls[tankType] = controlls;
}

function printParameters(tank,enemyTank){
	var data = {};
	data.myTank = {};
	data.myTank.x = tank.bitmap.x;
	data.myTank.y = tank.bitmap.y;
	data.myTank.rotation = tank.bitmap.rotation;
	data.myTank.cannonRotation = tank.cannon.bitmap.rotation;
	data.myTank.velocityX = tank.velocityX;
	data.myTank.velocityY = tank.velocityY;
	data.myTank.accelerationX = tank.accelerationX;
	data.myTank.accelerationY = tank.accelerationY;
	data.myTank.shootCooldown = tank.shootCooldown;
	data.myTank.controls = {};
	data.myTank.controls.turnLeft = keys[KEYCODE_LEFT];
	data.myTank.controls.turnRight = keys[KEYCODE_RIGHT];
	data.myTank.controls.goForward = keys[KEYCODE_UP];
	data.myTank.controls.goBack = keys[KEYCODE_DOWN];
	data.myTank.controls.shoot = keys[KEYCODE_SHOOT];
	data.myTank.controls.cannonLeft = keys[KEYCODE_CLEFT];
	data.myTank.controls.cannonRight = keys[KEYCODE_CRIGHT];
	
	data.enemyTank = {};
	data.enemyTank.x = enemyTank.bitmap.x;
	data.enemyTank.y = enemyTank.bitmap.y;
	data.enemyTank.rotation = enemyTank.bitmap.rotation;
	data.enemyTank.cannonRotation = enemyTank.cannon.bitmap.rotation;
	data.enemyTank.velocityX = enemyTank.velocityX;
	data.enemyTank.velocityY = enemyTank.velocityY;
	data.enemyTank.accelerationX = enemyTank.accelerationX;
	data.enemyTank.accelerationY = enemyTank.accelerationY;
	data.enemyTank.shootCooldown = enemyTank.shootCooldown;
	data.enemyTank.controls = {};
	data.enemyTank.controls.turnLeft = keys[KEYCODE_LEFT2];
	data.enemyTank.controls.turnRight = keys[KEYCODE_RIGHT2];
	data.enemyTank.controls.goForward = keys[KEYCODE_UP2];
	data.enemyTank.controls.goBack = keys[KEYCODE_DOWN2];
	data.enemyTank.controls.shoot = keys[KEYCODE_SHOOT2];
	data.enemyTank.controls.cannonLeft = keys[KEYCODE_CLEFT2];
	data.enemyTank.controls.cannonRight = keys[KEYCODE_CRIGHT2];
	console.log(data);
}

function getParams(tank, enemyTank, bullets, enemyBullets){
	var data = {};
	data.myTank = {};
	data.myTank.x = tank.bitmap.x;
	data.myTank.y = tank.bitmap.y;
	data.myTank.rotation = tank.bitmap.rotation;
	data.myTank.cannonRotation = tank.cannon.bitmap.rotation;
	data.myTank.velocityX = tank.velocityX;
	data.myTank.velocityY = tank.velocityY;
	data.myTank.accelerationX = tank.accelerationX;
	data.myTank.accelerationY = tank.accelerationY;
	data.myTank.shootCooldown = tank.shootCooldown;
	data.myTank.bullets = bullets.map(function(b) {
		return {x: b.bitmap.x, y: b.bitmap.y, velocityX: b.velocityX, velocityY: b.velocityY};
	});
	
	data.enemyTank = {};
	data.enemyTank.x = enemyTank.bitmap.x;
	data.enemyTank.y = enemyTank.bitmap.y;
	data.enemyTank.rotation = enemyTank.bitmap.rotation;
	data.enemyTank.cannonRotation = enemyTank.cannon.bitmap.rotation;
	data.enemyTank.velocityX = enemyTank.velocityX;
	data.enemyTank.velocityY = enemyTank.velocityY;
	data.enemyTank.accelerationX = enemyTank.accelerationX;
	data.enemyTank.accelerationY = enemyTank.accelerationY;
	data.enemyTank.shootCooldown = enemyTank.shootCooldown;
	data.enemyTank.bullets = enemyBullets.map(function(b) {
		return {x: b.bitmap.x, y: b.bitmap.y, velocityX: b.velocityX, velocityY: b.velocityY};
	});

	var brownTank = data.myTank;
	var greenTank = data.enemyTank;
	if (tank.type === 1) {
		brownTank = data.enemyTank;
		greenTank = data.myTank;
	}

	brownTank.controls = {};
	brownTank.controls.turnLeft = keys[KEYCODE_LEFT];
	brownTank.controls.turnRight = keys[KEYCODE_RIGHT];
	brownTank.controls.goForward = keys[KEYCODE_UP];
	brownTank.controls.goBack = keys[KEYCODE_DOWN];
	brownTank.controls.shoot = keys[KEYCODE_SHOOT];
	brownTank.controls.cannonLeft = keys[KEYCODE_CLEFT];
	brownTank.controls.cannonRight = keys[KEYCODE_CRIGHT];

	greenTank.controls = {};
	greenTank.controls.turnLeft = keys[KEYCODE_LEFT2];
	greenTank.controls.turnRight = keys[KEYCODE_RIGHT2];
	greenTank.controls.goForward = keys[KEYCODE_UP2];
	greenTank.controls.goBack = keys[KEYCODE_DOWN2];
	greenTank.controls.shoot = keys[KEYCODE_SHOOT2];
	greenTank.controls.cannonLeft = keys[KEYCODE_CLEFT2];
	greenTank.controls.cannonRight = keys[KEYCODE_CRIGHT2];
	
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
