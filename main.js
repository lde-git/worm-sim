/**
 * @file Main script file for the worm simulation.
 * @description This script contains functions and logic for controlling the behavior of a worm simulation.
 * The simulation includes a worm-like creature that moves towards a target, interacts with food, and updates its brain.
 * It also includes an inverse kinematics chain for drawing the worm's body.
 * The script uses the BRAIN object for brain simulation and manipulation.
 * The canvas element with id "canvas" is used for rendering the simulation.
 * The script also includes utility functions for drawing shapes and handling user input.
 * {@link ISimulateBrain} interface is used to simulate the brain of the worm.
 * {@link IKSegment} class is used to create segments for the inverse kinematics chain.
 * {@link IKChain} class is used to create a chain of segments for the inverse kinematics chain.
 * @see {@link BRAIN} object for brain simulation and manipulation.
 */
document.getElementById('clearButton').onclick = function () {
	food = [];
};

document.getElementById('centerButton').onclick = function () {
	target.x = window.innerWidth / 2;
	target.y = window.innerHeight / 2;
};

var facingDir = 0;
var targetDir = 0;
var speed = 0;
var targetSpeed = 0;
var speedChangeInterval = 0;
var food = [];


var prevAccumleft = 0;
var prevAccumright = 0;


var delta_accumleft = 0;
var delta_accumright = 0;



function toggleConnectome() {
	document.getElementById('nodeHolder').style.opacity =
		document.getElementById('connectomeCheckbox').checked ? '1' : '0';
}

BRAIN.setup();


let state = {
	foodEaten: false,
	noseHit: false,
	foodNearby: false,
	previousFoodNearby: false,
};




// Create a box for each post-synaptic neuron

for (var ps in BRAIN.connectome) {
	var nameBox = document.createElement('span');
	//nameBox.innerHTML = ps;
	document.getElementById('nodeHolder').appendChild(nameBox);

	var newBox = document.createElement('span');
	newBox.cols = 3;
	newBox.rows = 1;
	newBox.id = ps;
	newBox.className = 'brainNode';
	document.getElementById('nodeHolder').appendChild(newBox);
}

/**
 * Updates the brain of the worm.
 * This function updates the brain's state, updates the visual representation of the post-synaptic connections,
 * calculates the new direction and speed of the worm based on the accumulated left and right inputs.
 */
function updateBrain() {
	//BRAIN.update();
	for (var postSynaptic in BRAIN.connectome) {
		var psBox = document.getElementById(postSynaptic);
		var neuron = BRAIN.postSynaptic[postSynaptic][BRAIN.thisState];

		
		psBox.style.backgroundColor = '#FFFF00';
		psBox.style.opacity = Math.min(1, neuron / 50);
	}
	let scalingFactor = 20;
	
	let newDir = (BRAIN.accumleft - BRAIN.accumright) / scalingFactor;
	targetDir = facingDir + newDir * Math.PI;
	
	targetSpeed =
		(Math.abs(BRAIN.accumleft) + Math.abs(BRAIN.accumright)) /
		(scalingFactor * 5);
	speedChangeInterval = (targetSpeed - speed) / (scalingFactor * 1.5);

	



}

BRAIN.randExcite();
//setInterval(updateBrain, 1e3 / 60);
setInterval(updateBrain, 400)


function update() {
	var prevAccumleft = BRAIN.accumleft;
	var prevAccumright	= BRAIN.accumright;
	
	
	BRAIN.stimulateFoodSenseNeurons = false;
	BRAIN.stimulateNoseTouchNeurons	= false;
	state.foodEaten = false;

	


	
	speed += speedChangeInterval;

	
	var facingMinusTarget = facingDir - targetDir;
	var angleDiff = facingMinusTarget;

	// Calculate the smallest angle difference between the facing direction and the target direction
	if (Math.abs(facingMinusTarget) > 180) {
		if (facingDir > targetDir) {
			angleDiff = -1 * (360 - facingDir + targetDir);
		} else {
			angleDiff = 360 - targetDir + facingDir;
		}
	}	

	// Rotate the worm towards the target direction
	if (angleDiff > 0) {
		facingDir -= 0.1;
	} else if (angleDiff < 0) {
		facingDir += 0.1;
	}

	// Resolve the x and y components of the speed vector and update the worm's position
	target.x += Math.cos(facingDir) * speed;
	target.y -= Math.sin(facingDir) * speed;

	
	// Prevent x from going off the screen
	if (target.x < 0) {
		target.x = 0;
		BRAIN.stimulateNoseTouchNeurons = true;
	} else if (target.x > window.innerWidth) {
		target.x = window.innerWidth;
		BRAIN.stimulateNoseTouchNeurons = true;
	}

	// Prevent y from going off the screen
	if (target.y < 0) {
		target.y = 0;
		BRAIN.stimulateNoseTouchNeurons = true;
	} else if (target.y > window.innerHeight) {
		target.y = window.innerHeight;
		BRAIN.stimulateNoseTouchNeurons = true;
	}

	
	
	
	// Check if the worm is near food
	for (var i = 0; i < food.length; i++) {
		if (
			Math.hypot(
				Math.round(target.x) - food[i].x,
				Math.round(target.y) - food[i].y,
			) <= 100
		) {
			// simulate food sense if food nearby
			BRAIN.stimulateFoodSenseNeurons = true;

			if (
				Math.hypot(
					Math.round(target.x) - food[i].x,
					Math.round(target.y) - food[i].y,
				) <= 20
			) {
				// eat food if close enough
				food.splice(i, 1);
				state.foodEaten = true;
			}
		}
	}

	// Update IK chain
	chain.update(target);

	//Update state variables
	if (state.foodEaten) {
		BRAIN.stimulateFoodSenseNeurons = false;
		state.previousFoodNearby = false;
	}
	state.noseHit = BRAIN.stimulateNoseTouchNeurons;
	state.previousFoodNearby = state.foodNearby;
	state.foodNearby = BRAIN.stimulateFoodSenseNeurons;

	
	//calculate reward
	
	
	BRAIN.update();
	
	var delta_accumleft = BRAIN.accumleft - prevAccumleft;
	var delta_accumright = BRAIN.accumright - prevAccumright;
	
	let reward = rewardFunction(state, [delta_accumleft, delta_accumright]);
	
	let trainingData = {
		input: [state.foodNearby, state.noseHit],
		output: [delta_accumleft, delta_accumright]
	};

	BRAIN.train([trainingData], {
		errorThresh: 0.005,  // Error threshold to stop training
        iterations: 20000,   // Maximum training iterations
        log: true,           // Log training progress to console
        logPeriod: 10,       // Log every 10 iterations
        learningRate: 0.3    // Learning rate
	})

	console.log("noseHit:"+state.noseHit+"\n foodNearby:"+state.foodNearby+"\n foodEaten:"+state.foodEaten+"\n previousFoodNearby:"+state.previousFoodNearby);
	
	
}




function rewardFunction(state, action) {
    let reward = 0;

    // Reward for eating food
    if (state.foodEaten) {
        reward += 10; // Significant positive reward
    }

    // Penalty for bumping into obstacles
    if (state.noseHit) {
        reward -= 2; // Moderate penalty
    }

    // Bonus for finding food (sensing food nearby)
    if (state.foodNearby && !state.previousFoodNearby) { 
        reward += 3; // Encourage exploration and discovery
    }

    // Penalty for leaving food area without eating
    if (!state.foodNearby && state.previousFoodNearby && !state.foodEaten) {
        reward -= 5; // Discourage leaving food behind
    }

    // Time penalty to encourage efficiency (optional)
    reward -= 0.1; // Small penalty for each time step

    return reward;
}



//http://jsfiddle.net/user/ARTsinn/fiddles/

/**
 * Represents an Inverse Kinematics (IK) segment.
 * @constructor
 * @param {number} size - The size of the segment.
 * @param {Object} head - The position of the segment's head.
 * @param {number} head.x - The x-coordinate of the head.
 * @param {number} head.y - The y-coordinate of the head.
 * @param {Object} tail - The position of the segment's tail.
 * @param {number} tail.x - The x-coordinate of the tail.
 * @param {number} tail.y - The y-coordinate of the tail.
 */
var IKSegment = function (size, head, tail) {
	this.size = size;
	this.head = head || {
		x: 0.0,
		y: 0.0,
	};
	this.tail = tail || {
		x: this.head.x + size,
		y: this.head.y + size,
	};

	this.update = function () {
		// Position derivitives
		var dx = this.head.x - this.tail.x;
		var dy = this.head.y - this.tail.y;

		// Distance between head and tail
		var dist = Math.sqrt(dx * dx + dy * dy);
		// Force of the spring (Hook's Law)
		var force = 0.5 - (this.size / dist) * 0.5;
		var strength = 0.998; // No springiness

		// Dampening
		force *= 0.99;

		// Force vectors
		var fx = force * dx;
		var fy = force * dy;

		// Update head and tail positions
		this.tail.x += fx * strength * 2.0;
		this.tail.y += fy * strength * 2.0;
		this.head.x -= fx * (1.0 - strength) * 2.0;
		this.head.y -= fy * (1.0 - strength) * 2.0;
	};
};

/**
 * Represents an inverse kinematics chain. It is a collection of IK segments.
 * @constructor
 * @param {number} size - The number of links in the chain.
 * @param {number} interval - The interval between each link.
 */
var IKChain = function (size, interval) {
	this.links = new Array(size);

	this.update = function (target) {
		var link = this.links[0];

		link.head.x = target.x;
		link.head.y = target.y;

		for (var i = 0, n = this.links.length; i < n; ++i) {
			this.links[i].update();
		}
	};

	var point = {
		x: 0,
		y: 0,
	};

	for (var i = 0, n = this.links.length; i < n; ++i) {
		var link = (this.links[i] = new IKSegment(interval, point));
		link.head.x = Math.random() * 500;
		link.head.y = Math.random() * 500;
		link.tail.x = Math.random() * 500;
		link.tail.y = Math.random() * 500;
		point = link.tail;
	}
};

/* Test */

/**
 * Draws a circle on the canvas.
 *
 * @param {CanvasRenderingContext2D} ctx - The rendering context of the canvas.
 * @param {number} x - The x-coordinate of the center of the circle.
 * @param {number} y - The y-coordinate of the center of the circle.
 * @param {number} r - The radius of the circle.
 * @param {string} [c] - The color of the circle. If not provided, a default color will be used.
 */
function circle(ctx, x, y, r, c) {
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2, false);
	ctx.closePath();
	if (c) {
		ctx.fillStyle = c;
		ctx.fill();
	} else {
		ctx.strokeStyle = 'rgba(255,255,255,0.1)';
		ctx.stroke();
	}
}

/**
 * Draws a line on the canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {number} x1 - The x-coordinate of the starting point of the line.
 * @param {number} y1 - The y-coordinate of the starting point of the line.
 * @param {number} x2 - The x-coordinate of the ending point of the line.
 * @param {number} y2 - The y-coordinate of the ending point of the line.
 */
function line(ctx, x1, y1, x2, y2) {
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.strokeStyle = 'rgba(255,255,255,0.5)';
	ctx.stroke();
}

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

canvas.addEventListener('mousedown', addFood, false);

/**
 * Adds food to the game at the specified coordinates.
 * @param {MouseEvent} event - The mouse event object containing the coordinates of the click.
 */
function addFood(event) {
	var x = event.x;
	var y = event.y;

	x -= canvas.offsetLeft;
	y -= canvas.offsetTop;

	food.push({ x: x, y: y });
}

/**
 * Draws the food on the canvas.
 */
function drawFood() {
	for (var i = 0; i < food.length; i++) {
		circle(ctx, food[i].x, food[i].y, 10, 'rgb(251,192,45)');
	}
}

var target = {
	x: window.innerWidth / 2,
	y: window.innerHeight / 2,
};

var chain = new IKChain(200, 1);

/*
// Updated Update Function
function update() {
    speed += speedChangeInterval;

    // Check for key presses to update target direction
    document.addEventListener('keydown', (event) => {
        if (event.key === 'a') {
            targetDir = facingDir - Math.PI / 4; // Turn left 45 degrees
        } else if (event.key === 'd') {
            targetDir = facingDir + Math.PI / 4; // Turn right 45 degrees
        }
    });

    const facingMinusTarget = facingDir - targetDir;
    let angleDiff = facingMinusTarget;

    // Ensure angle difference is in the -180 to 180 degree range
    if (Math.abs(facingMinusTarget) > Math.PI) {
        angleDiff -= Math.sign(facingMinusTarget) * 2 * Math.PI;
    }

    // Rotate the worm towards the target direction with a maximum turn speed
    const maxTurnSpeed = 0.1; // Adjust this for faster/slower turns
    if (angleDiff > 0) {
        facingDir -= Math.min(angleDiff, maxTurnSpeed);
    } else if (angleDiff < 0) {
        facingDir += Math.min(-angleDiff, maxTurnSpeed);
    }

    target.x += Math.cos(facingDir) * speed;
    target.y -= Math.sin(facingDir) * speed;

    // Prevent x from going off the screen
    if (target.x < 0) {
        target.x = 0;
        BRAIN.stimulateNoseTouchNeurons = true;
    } else if (target.x > window.innerWidth) {
        target.x = window.innerWidth;
        BRAIN.stimulateNoseTouchNeurons = true;
    }

    // Prevent y from going off the screen
    if (target.y < 0) {
        target.y = 0;
        BRAIN.stimulateNoseTouchNeurons = true;
    } else if (target.y > window.innerHeight) {
        target.y = window.innerHeight;
        BRAIN.stimulateNoseTouchNeurons = true;
    }

    // Check if the worm is near food
    for (var i = 0; i < food.length; i++) {
        if (
            Math.hypot(
                Math.round(target.x) - food[i].x,
                Math.round(target.y) - food[i].y
            ) <= 100
        ) {
            // simulate food sense if food nearby
            BRAIN.stimulateFoodSenseNeurons = true;

            if (
                Math.hypot(
                    Math.round(target.x) - food[i].x,
                    Math.round(target.y) - food[i].y
                ) <= 20
            ) {
                // eat food if close enough
                food.splice(i, 1);
            }
        }
    }

    // Reset neuron stimulation after 2 seconds
    setTimeout(function () {
        BRAIN.stimulateHungerNeurons = true; // Assuming the worm is always hungry
        BRAIN.stimulateNoseTouchNeurons = false;
        BRAIN.stimulateFoodSenseNeurons = false;
    }, 2000);

    // Update IK chain
    chain.update(target);
}
*/

/**
 * Draws the worm simulation on the canvas.
 */
function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawFood();

	circle(ctx, target.x, target.y, 5, 'rgba(255,255,255,0.1)');

	var link = chain.links[0];
	var p1 = link.head,
		p2 = link.tail;

	ctx.beginPath();
	ctx.moveTo(p1.x, p1.y);
	ctx.strokeStyle = 'white';
	ctx.lineWidth = 20;
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';

	for (var i = 0, n = chain.links.length; i < n; ++i) {
		link = chain.links[i];
		p1 = link.head;
		p2 = link.tail;
		ctx.lineTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
	}

	ctx.stroke();
}

(function resize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	window.onresize = resize;
})();

setInterval(function () {
	update();
	draw();
}, 1e3/60);
