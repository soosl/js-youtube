const content = document.querySelector('.content');
const navMenuMore = document.querySelector('.nav-menu-more');
const showMore = document.querySelector('.show-more');
const formSearch = document.querySelector('.form-search');
const subscrList = document.querySelector('.subscr-list');
const customChannelHeader = document.querySelector('.custom-channel-header');
const navLinkLiked = document.querySelectorAll('.nav-link-liked');
const navLinkTrending = document.querySelectorAll('.nav-link-trending');
const navLinkHome = document.querySelectorAll('.nav-link-home');
const navLinkMusic = document.querySelector('.nav-link-music');
const navLinkGames = document.querySelector('.nav-link-games');
const navLinkSubscr = document.querySelectorAll('.nav-link-subscr');
const noAuthEl = document.querySelectorAll('.hide-no-auth');

const createCard = dataVideo => {
	let isChannel = false;
	if (dataVideo.kind === 'youtube#subscription' || dataVideo.id.kind === 'youtube#channel') isChannel = true;
	const imgUrl = dataVideo.snippet.thumbnails.high.url;
	const videoId = dataVideo.id.videoId || dataVideo.id;
	const videoTitle = dataVideo.snippet.title;
	const viewCount = dataVideo.statistics ? dataVideo.statistics.viewCount : null;
	const dateVideo = dataVideo.snippet.publishedAt;
	const channelTitle = dataVideo.snippet.channelTitle;
	const totalItemCount = dataVideo.contentDetails ? dataVideo.contentDetails.totalItemCount : null;
	const channelId = dataVideo.snippet.resourceId
		? dataVideo.snippet.resourceId.channelId
		: dataVideo.id.channelId || null;
	const card = document.createElement('li');
	card.classList.add('video-card');
	card.insertAdjacentHTML(
		'beforeend',
		`
			<div class="video-thumb">
			${
				!isChannel
					? `
				<a class="link-video youtube-modal" href="https://youtu.be/${videoId}">
					<img src="${imgUrl}" alt="" class="thumbnail">
				</a>
			`
					: `
				<a class="link-video youtube-subscribe" href="https://www.youtube.com/channel/${channelId}" data-title="${videoTitle}" data-channel-id="${channelId}">
					<img src="${imgUrl}" alt="" class="thumbnail">
				</a>
			`
			}

			</div>
			<h3 class="video-title">${videoTitle}</h3>
			<div class="video-info">
				<span class="video-counter">
					${viewCount ? `<span class="video-views">${formatViews(viewCount)}</span>` : ''}
					<span class="video-date">${formatDate(dateVideo)}</span>
				</span>
				<span class="video-channel">${channelTitle ? channelTitle : totalItemCount + ' videos'}</span>
			</div>
		`
	);
	return card;
};

const createList = (data, title, body, noClear) => {
	const listVideo = data.items;
	const channel = document.createElement('section');
	channel.classList.add('channel');

	if (body && !noClear) {
		content.textContent = '';
	}

	if (title) {
		const header = document.createElement('h2');
		header.textContent = title;
		channel.insertAdjacentElement('afterbegin', header);
	}

	const wrapper = document.createElement('ul');
	wrapper.classList.add('video-list');
	channel.insertAdjacentElement('beforeend', wrapper);

	listVideo.forEach(video => wrapper.append(createCard(video)));

	content.insertAdjacentElement('beforeend', channel);

	if (body) {
		const nextList = document.createElement('button');
		nextList.textContent = 'More';

		nextList.style.display = 'block';
		nextList.style.margin = '30px auto';
		nextList.style.border = '1px solid red';
		nextList.style.background = '#fff';
		nextList.style.color = 'red';
		nextList.style.padding = '0.2rem 0.5rem';

		content.insertAdjacentElement('beforeend', nextList);
		nextList.addEventListener('click', () => {
			const pageToken = data.nextPageToken;
			let request = '';
			if (pageToken) {
				switch (data.kind) {
					case 'youtube#videoListResponse':
						request = 'videos';
						break;
					case 'youtube#SubscriptionListResponse':
						request = 'subscriptions';
						break;
					case 'youtube#searchListResponse':
						request = 'search';
						break;
					default:
						content.insertAdjacentHTML('beforeend', '<small>There is no results</small>');
				}
				nextList.remove();
				gapi.client.youtube[request].list({ ...body, pageToken }).execute(response => {
					createList(response, '', body, true);
				});
			}
		});
		if (!data.nextPageToken && data.prevPageToken) {
			nextList.remove();
		}
	}
};

const createSubscrList = data => {
	const subscr = data.items;
	subscrList.textContent = '';
	subscr.forEach(item => {
		const {
			title,
			thumbnails: {
				high: { url },
			},
			resourceId: { channelId },
		} = item.snippet;
		const html = `
			<li class="nav-item">
				<a href="#" data-id="${channelId}" data-title="${title}" class="nav-link">
					<img
						src="${url}"
						alt="${title}"
						class="nav-image"
					/>
					<span class="nav-text">${title}</span>
				</a>
			</li>
		`;
		subscrList.insertAdjacentHTML('beforeend', html);
	});
};

const formatDate = date => {
	const currentDay = Date.parse(new Date());
	const days = Math.round((currentDay - Date.parse(new Date(date))) / 86400000);
	if (days > 30) {
		if (days > 60) {
			return Math.round(days / 30) + ' months ago';
		}
		return 'One month ago';
	}

	if (days > 1) {
		return Math.round(days) + ' days ago';
	}
	return 'One day ago';
};

const formatViews = views => {
	if (views >= 1000000) {
		return Math.round(views / 1000000) + 'm views';
	}
	if (views >= 1000) {
		return Math.round(views / 1000) + 'k views';
	}

	return count + ' views';
};

// youtube APi
// https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow

const authBtn = document.querySelector('.auth-btn');
const userAvatar = document.querySelector('.user-avatar');

const handleAuth = () => {
	gapi.auth2.getAuthInstance().signIn();
};

const handleSignOut = () => {
	gapi.auth2.getAuthInstance().signOut();
};

const handleSuccessAuth = data => {
	authBtn.classList.add('hide');
	noAuthEl.forEach(item => item.classList.remove('hide-no-auth'));
	userAvatar.src = data.getImageUrl();
	userAvatar.alt = data.getName();

	getSubscriptions(createSubscrList, 10);
};

const handleNoAuth = () => {
	authBtn.classList.remove('hide');
	noAuthEl.forEach(item => item.classList.add('hide-no-auth'));
	userAvatar.src = '';
	userAvatar.alt = '';
};

const updateAuthStatus = data => {
	data.isSignedIn.listen(() => {
		updateAuthStatus(data);
	});

	if (data.isSignedIn.get()) {
		const userData = data.currentUser.get().getBasicProfile();
		handleSuccessAuth(userData);
	} else {
		handleNoAuth();
	}
};

var GoogleAuth; // Google Auth object.
function initClient() {
	gapi.client
		.init({
			apiKey: API_KEY,
			clientId: CLIEND_ID,
			scope: 'https://www.googleapis.com/auth/youtube.readonly',
			discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'],
		})
		.then(() => {
			updateAuthStatus(gapi.auth2.getAuthInstance());
			authBtn.addEventListener('click', handleAuth);
			userAvatar.addEventListener('click', handleSignOut);
		})
		.then(loadData)
		.catch(error => console.warn(error));
}

gapi.load('client:auth2', initClient);

const getVideos = (channelId, callback, maxResults = 6) => {
	const body = { part: 'snippet', channelId, maxResults, order: 'date' };
	gapi.client.youtube.search.list(body).execute(response => {
		callback(response, body);
	});
};

const getTrends = (callback, maxResults = 6) => {
	const body = {
		part: 'snippet, statistics',
		chart: 'mostPopular',
		regionCode: 'BY',
		maxResults,
	};
	gapi.client.youtube.videos.list(body).execute(response => {
		callback(response, body);
	});
};

const getVideoCat = (callback, videoCategoryId, maxResults = 6) => {
	const body = {
		part: 'snippet, statistics',
		chart: 'mostPopular',
		// regionCode: "BY",
		maxResults,
		videoCategoryId,
	};
	gapi.client.youtube.videos.list(body).execute(response => {
		callback(response, body);
	});
};

const getSearch = (searchValue, callback, maxResults = 6) => {
	const body = {
		part: 'snippet',
		q: searchValue,
		maxResults,
		order: 'relevance',
	};
	gapi.client.youtube.search.list(body).execute(response => {
		callback(response, body);
	});
};

const getSubscriptions = (callback, maxResults = 12) => {
	const body = {
		part: 'snippet, contentDetails',
		mine: true,
		maxResults,
		order: 'unread',
	};
	if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
		gapi.client.youtube.subscriptions.list(body).execute(response => {
			callback(response, body);
		});
	} else {
		handleAuth();
	}
};

const getLiked = (callback, maxResults = 12) => {
	const body = {
		part: 'snippet, statistics',
		maxResults,
		myRating: 'like',
	};
	gapi.client.youtube.videos.list(body).execute(response => {
		callback(response, body);
	});
};

const loadData = () => {
	content.textContent = '';
	getVideos('UCg8ss4xW9jASrqWGP30jXiw', data => {
		createList(data, 'Владилен Минин');
		getTrends(data => {
			createList(data, 'Trends');
			getVideoCat(data => createList(data, 'Popular Music'), 10, 6);
		});
	});
};

showMore.addEventListener('click', event => {
	event.preventDefault();
	navMenuMore.classList.toggle('nav-menu-more-show');
});

formSearch.addEventListener('submit', event => {
	event.preventDefault();
	getSearch(formSearch.elements.search.value, (data, body) => createList(data, 'Результат поиска', body));
});

subscrList.addEventListener('click', event => {
	event.preventDefault();
	const target = event.target;
	const channelLink = target.closest('.nav-link');
	const channelId = channelLink.dataset.id;
	const channelTitle = channelLink.dataset.title;
	getVideos(
		channelId,
		(data, body) => {
			createList(data, channelTitle, body);
		},
		12
	);
});

navLinkLiked.forEach(item => {
	item.addEventListener('click', event => {
		event.preventDefault();
		getLiked((data, body) => {
			createList(data, 'Liked Videos', body);
		}, 12);
	});
});

navLinkTrending.forEach(item => {
	item.addEventListener('click', event => {
		event.preventDefault();
		getTrends((data, body) => {
			createList(data, 'Trending', body);
		}, 12);
	});
});

navLinkHome.forEach(item => {
	item.addEventListener('click', event => {
		event.preventDefault();
		loadData();
	});
});

navLinkMusic.addEventListener('click', event => {
	event.preventDefault();
	getVideoCat(
		(data, body) => {
			createList(data, 'Music', body);
		},
		10,
		12
	);
});

navLinkGames.addEventListener('click', event => {
	event.preventDefault();
	getVideoCat(
		(data, body) => {
			createList(data, 'Games', body);
		},
		20,
		12
	);
});

navLinkSubscr.forEach(item => {
	item.addEventListener('click', event => {
		event.preventDefault();
		getSubscriptions((data, body) => {
			createList(data, 'Subscriptions', body);
		});
	});
});

content.addEventListener('click', event => {
	const target = event.target;
	const channel = target.closest('.youtube-subscribe');
	if (channel) {
		event.preventDefault();
		getVideos(
			channel.dataset.channelId,
			(data, body) => {
				createList(data, channel.dataset.title, body);
			},
			12
		);
	}
});
