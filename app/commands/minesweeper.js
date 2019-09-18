module.exports = {
	name: 'minesweeper',
	description: 'Play minesweeper. .minesweeper <Width> <Height> <Mines>',
	channels: ['gameroom'],
	execute(message, args, client)
	{
		generateGame(args[0], args[1], args[2], message, args[3]);
	},
};

// Gets called when you run the `!minesweeper` command
function generateGame(gameWidth, gameHeight, numMines, message, isRaw)
{
	// Minesweeper script by JochCool
	// If you add these xy values to some other coordinate, you'll get the eight neighbours of that coordinate.
	const neighbourLocations = [{ x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 }];
	const numberEmoji = [':zero:', ':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:'];
	isRaw = isRaw || false;
	// Check game size
	if (isNaN(gameWidth))
	{
		gameWidth = 8;
	}
	else if (gameWidth <= 0 || gameHeight <= 0)
	{
		return 'Uh, I\'m not smart enough to generate a maze of that size. I can only use positive numbers. Sorry :cry:';
	}
	if (isNaN(gameHeight))
	{
		gameHeight = 8;
	}
	else if (gameWidth > 40 || gameHeight > 20)
	{
		return 'That\'s way too large! Think of all the mobile users who are going to see this!';
	}

	// Check mine count
	if (isNaN(numMines))
	{
		numMines = Math.round(gameWidth * gameHeight / 5);
	}
	else
	if (numMines <= 0)
	{
		return 'You think you can look clever by solving a Minesweeper game without mines? Not gonna happen my friend.';
	}
	else if (numMines > gameWidth * gameHeight)
	{
		return 'I can\'t fit that many mines in this game!';
	}

	// Generate game (2D array sorted [y][x], -1 means a mine, positive number is the amount of neighbouring mines)
	const game = [];

	for (let y = 0; y < gameHeight; y++)
	{
		game.push([]);
		for (let x = 0; x < gameWidth; x++)
		{
			game[y].push(0);
		}
	}

	// Fill it with mines!
	for (let mine = 0; mine < numMines; mine++)
	{
		const x = Math.floor(Math.random() * gameWidth),
			y = Math.floor(Math.random() * gameHeight);

		// Retry if there was already a mine there
		if (game[y][x] === -1)
		{
			mine--;
			continue;
		}

		game[y][x] = -1;

		// Add 1 to neighbouring tiles
		for (let j = 0; j < neighbourLocations.length; j++)
		{
			const newCoord = { x: x + neighbourLocations[j].x, y: y + neighbourLocations[j].y };
			if (newCoord.y >= 0 && newCoord.y < game.length &&
			newCoord.x >= 0 && newCoord.x < game[newCoord.y].length &&
			game[newCoord.y][newCoord.x] !== -1)
			{
				game[newCoord.y][newCoord.x]++;
			}
		}

		/* Old code:
		if (x > 0                && y > 0             && game[y-1][x-1] !== -1) { game[y-1][x-1]++; }
		if (                        y > 0             && game[y-1][x  ] !== -1) { game[y-1][x  ]++; }
		if (x < game[y].length-1 && y > 0             && game[y-1][x+1] !== -1) { game[y-1][x+1]++; }
		if (x < game[y].length-1                      && game[y  ][x+1] !== -1) { game[y  ][x+1]++; }
		if (x < game[y].length-1 && y < game.length-1 && game[y+1][x+1] !== -1) { game[y+1][x+1]++; }
		if (                        y < game.length-1 && game[y+1][x  ] !== -1) { game[y+1][x  ]++; }
		if (x > 0                && y < game.length-1 && game[y+1][x-1] !== -1) { game[y+1][x-1]++; }
		if (x > 0                                     && game[y  ][x-1] !== -1) { game[y  ][x-1]++; }
		//*/
	}

	// Find all the zeroes in this game (for uncovering)
	const zeroLocations = [];
	for (let y = 0; y < game.length; y++)
	{
		for (let x = 0; x < game[y].length; x++)
		{
			if (game[y][x] === 0)
			{
				zeroLocations.push({ x: x, y: y });
			}
		}
	}

	// Uncover a random region
	// 2D array, each value is either nothing (not uncovered) or true (uncovered)
	const uncoveredLocations = [];
	for (let y = 0; y < game.length; y++)
	{
		uncoveredLocations.push([]);
	}
	if (zeroLocations.length > 0)
	{
		// Select random starting point
		const locationsToUncover = [];
		locationsToUncover.push(zeroLocations[Math.floor(Math.random() * zeroLocations.length)]);

		// Uncover neighbouring tiles
		while (locationsToUncover.length > 0)
		{
			for (let j = 0; j < neighbourLocations.length; j++)
			{
				const newCoord = { x: locationsToUncover[0].x + neighbourLocations[j].x, y: locationsToUncover[0].y + neighbourLocations[j].y };
				if (newCoord.y < 0 || newCoord.y >= game.length ||
				newCoord.x < 0 || newCoord.x >= game[newCoord.y].length ||
				uncoveredLocations[newCoord.y][newCoord.x] === true) { continue; }
				uncoveredLocations[newCoord.y][newCoord.x] = true;
				if (game[newCoord.y][newCoord.x] === 0)
				{
					locationsToUncover.push(newCoord);
				}
			}
			locationsToUncover.shift();
		}
	}

	// Create the reply
	let returnTxt;
	if (numMines === 1) { returnTxt = 'Here\'s a board sized ' + gameWidth + 'x' + gameHeight + ' with 1 mine:'; }
	else { returnTxt = 'Here\'s a board sized ' + gameWidth + 'x' + gameHeight + ' with ' + numMines + ' mines:'; }

	if (isRaw) { returnTxt += '\n```'; }

	for (let y = 0; y < game.length; y++)
	{
		returnTxt += '\n';
		for (let x = 0; x < game[y].length; x++)
		{
			if (game[y][x] === -1)
			{
				returnTxt += '||:bomb:||';
			}
			else if (uncoveredLocations[y][x])
			{
				returnTxt += numberEmoji[game[y][x]];
			}
			else
			{
				returnTxt += '||' + numberEmoji[game[y][x]] + '||';
			}
		}
	}

	if (isRaw) { returnTxt += '\n```'; }

	// Send the message if it's not longer than 2000 chars (Discord's limit)
	if (returnTxt.length <= 2000)
	{
		return message.channel.send(returnTxt);
	}

	// Otherwise, split the message
	const splitReturns = [];
	do
	{
		const splitIndex = returnTxt.substring(0, 1900).lastIndexOf('\n');
		if (splitIndex === -1)
		{
			log('A too large message was generated after creating a game.');
			return 'Sorry, your message appears to be too large to send. Please try a smaller game next time.';
		}
		splitReturns.push(returnTxt.substring(0, splitIndex));
		returnTxt = returnTxt.substring(splitIndex + 1);
	} while (returnTxt.length > 1900);

	splitReturns.push(returnTxt);

	// Send the messages one by one
	let i = 0;
	function sendNextMessage()
	{
		if (i < splitReturns.length) { message.channel.send(splitReturns[i++]).then(sendNextMessage, log); }
	}
	sendNextMessage();
}

function log(message)
{
	if (message instanceof Error)
	{
		message = message.stack;
	}
}