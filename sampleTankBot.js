function(e) {
    console.log("Green worker triggered:");
	console.log(e);
    var response = {};
    var enemy = e.data.enemyTank;
    
    // If enemy was shooting we shoot as well!
    if(enemy.shootCooldown !== 0) {
        response.shoot = 1;
    }

    //if enemy is in motion lets do loops
    if(enemy.accelerationX > 0 || enemy.accelerationY > 0) {
        response.up = 1;
        response.right = 1;
    } else if (enemy.accelerationX < 0 || enemy.accelerationY < 0) {
        response.down = 1;
        response.left = 1;
    }
    self.postMessage(response);
}