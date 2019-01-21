require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const ogs = require('open-graph-scraper');
const firebase = require('firebase');

const bot = new TelegramBot(process.env.TELEGRAM_API_TOKEN, { polling: true });

const app = firebase.initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "bookmark-manager-f9485.firebaseapp.com",
  databaseURL: "https://bookmark-manager-f9485.firebaseio.com",
  projectId: "bookmark-manager-f9485",
  storageBucket: "bookmark-manager-f9485.appspot.com",
  messagingSenderId: "184400661494"
});
const ref = firebase.database().ref();
const sitesRef = ref.child("sites");

bot.onText(/\/test/, (msg, match) => {
	sitesRef.push().set({
		test: 1
	});

	bot.sendMessage(msg.chat.id, 'Ok!');
});

let siteUrl;
bot.onText(/\/bookmark (.+)/, (msg, match) => {
	siteUrl = match[1];

	bot.sendMessage(msg.chat.id, 'Got it, which category?', {
		reply_markup: {
			inline_keyboard: [[
				{
					text: 'Development',
					callback_data: 'development'
				},{
					text: 'Music',
					callback_data: 'music'
				},{
					text: 'Cute monkeys',
					callback_data: 'cute-monkeys'
				}
			]]
		}
	})
})

bot.on('callback_query', (callbackQuery) => {
	const msg = callbackQuery.message;

	ogs({ 'url': siteUrl }, (error, results) => {
		if (results.success) {
			sitesRef.push().set({
				name: results.data.ogSiteName || '',
				title: results.data.ogTitle,
				description: results.data.ogDescription,
				url: siteUrl,
				thumbnail: results.data.ogImage.url,
				category: callbackQuery.data
			});

			bot.sendMessage(msg.chat.id, `Added ${results.data.ogTitle} to ${callbackQuery.data}!`);

		} else {
			sitesRef.push().set({
				url: siteUrl
			});

			bot.sendMessage(msg.chat.id, 'Added new website, but there is no OG data!');
		}
	})
});
