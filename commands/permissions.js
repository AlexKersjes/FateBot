module.exports = {
	name: 'perm',
	description: 'lists permissions in console.',
	execute(message, args, client)
	{
		console.log(message.member.permissions);
	},
};