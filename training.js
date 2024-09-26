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