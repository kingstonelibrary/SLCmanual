/* eslint-disable no-shadow */
/* eslint-disable no-use-before-define */
/* eslint-disable one-var */
/* eslint-disable no-console */
/* eslint-disable no-debugger */
/* eslint-disable prefer-const */
/* eslint-disable no-var */
/* eslint-disable vars-on-top */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-template */
/* eslint-disable no-undef */
/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */

$(document).ready(function($) {
	var config = {
			apiKey: 'AIzaSyCAQ_TOCtBTXel87hCCRdXy-L4eUPt1UFg',
			authDomain: 'gcmproject-141802.firebaseapp.com',
			databaseURL: 'https://gcmproject-141802.firebaseio.com',
			projectId: 'gcmproject-141802',
			storageBucket: 'gcmproject-141802.appspot.com',
			messagingSenderId: '961587936477'
	};
	firebase.initializeApp(config);

	const messaging = firebase.messaging();
	// const db = firebase.firestore();
	// const settings = {/* your settings... */};
	// db.settings(settings);

	let onWorkerMessage = e => {
			console.log('[UI] received message from SW.Message was ' + e);
			location.reload();
	};

	if ('serviceWorker' in navigator) {
			navigator.serviceWorker
					.register('./sw.js', { scope: './' })
					.then(function(registration) {
							console.log('[UI] Service Worker Registered');
							messaging.useServiceWorker(registration); // プッシュ通知受信イベントハンドラがSWスクリプト内にあるので、FireBaseに登録したSWを指定してやる
							messaging.requestPermission().then(() => {
									// プッシュ通知許諾リクエスト
									console.log('[UI] permission granted');
									messaging.getToken().then(token => {
											// トークンをFireBaseのDBに格納（トピックに登録すればいいのでDBにはしないが、DB操作例としておいておく）
											// db.collection("tokens").add({
											//   token: token
											// })
											// .then(function(docRef) {
											//     console.log("Document written with ID: ", docRef.id);
											// })
											// .catch(function(error) {
											//     console.error("Error adding document: ", error);
											// });
											// トークンをトピックに登録
											var xhr = new XMLHttpRequest();
											var url =
													'https://iid.googleapis.com/iid/v1/' +
													token +
													'/rel/topics/slcpush';
											console.log('[UI] トピックにトークン登録：' + url);
											xhr.open('POST', url);
											xhr.setRequestHeader('content-type', 'application/json'); // ↓ 以下は [クラウドメッセージング]-[サーバーキー]
											xhr.setRequestHeader(
													'Authorization',
													'key=AAAA3-MbfN0:APA91bGtlCrxRI-_F6tEZOAW-ebhX5_39F3DiAnwK7wRlsL9dd7bWylNtc3AhzQmaNVVJnLcX2D1l7wVEGjyk1yn3gfKQwW57uJ7Qq7DQzfUJ67zeSeK5cjuEBBRK9SZRZTuDTyzrxUF'
											);
											xhr.send();
											xhr.onreadystatechange = function() {
													console.log(xhr.status);
											};
									});
							});
							messaging.onTokenRefresh(function() {
									// トークン更新で呼ばれるハンドラでDBとトピックにと登録し直す
									messaging
											.getToken()
											.then(function(refreshedToken) {
													console.log('[UI] Token refreshed.');
													// トークン格納
													// db.collection("tokens").add({
													//   token: refreshedToken
													// })
													// .then(function(docRef) {
													//     console.log("Document written with ID: ", docRef.id);
													// })
													// .catch(function(error) {
													//     console.error("Error adding document: ", error);
													// });
													// トークンをトピックに登録
													var xhr = new XMLHttpRequest();
													var url =
															'https://iid.googleapis.com/iid/v1/' +
															refreshedToken +
															'/rel/topics/slcpush';
													console.log('[UI] トピックにrefreshトークン登録：' + url);
													xhr.open('POST', url);
													xhr.setRequestHeader('content-type', 'application/json');
													xhr.setRequestHeader(
															'Authorization',
															'key=AAAA3-MbfN0:APA91bGtlCrxRI-_F6tEZOAW-ebhX5_39F3DiAnwK7wRlsL9dd7bWylNtc3AhzQmaNVVJnLcX2D1l7wVEGjyk1yn3gfKQwW57uJ7Qq7DQzfUJ67zeSeK5cjuEBBRK9SZRZTuDTyzrxUF'
													);
													xhr.send();
													xhr.onreadystatechange = function() {
															console.log(xhr.status);
													};
											})
											.catch(function(err) {
													console.log('[UI] Unable to retrieve refreshed token ', err);
													// showToken('Unable to retrieve refreshed token ', err);
											});
							});

							// （変更反映工夫）このSW登録イベントハンドラ内でSWにメッセージしてキャッシュを消させてからリロードさせてる       
							const channel = new MessageChannel();
							channel.port1.onmessage = ev => {
									console.log('[UI]messsage from SW:' + ev.data);
							};
							registration.onupdatefound = function() {
									console.log('[UI] SW update was detected');
									if (typeof registration.update === 'function') {
											registration.update();
											navigator.serviceWorker.controller.postMessage({ type: 'updateDESU!' }, [
													channel.port2
											]);
											console.log('[UI] Sent updateDESU! to SW');
											setTimeout(location.reload(), 1000);
									}
							}; 
					});

			navigator.serviceWorker.ready.then(function(registration) {
					console.log('[UI] Service Worker Ready');
			});
			navigator.serviceWorker.addEventListener('message', onWorkerMessage);
	} /* end of if ("serviceWorker" in navigator) */

	messaging.onMessage(function(payload) { // プッシュメッセージ
			// ウェブアプリがフォアグラウンドの場合のメッセージ処理
			console.log('[UI] Push Message received.', payload);
			// ...
	});

	/**
		* インストールボタン表示＆インストール処理
		*/
	/* 
			let deferredPrompt;
			let btnAdd = document.getElementsByClassName('btn-flat-border')[0];
			window.addEventListener('beforeinstallprompt', (e) => {
					console.log('[UI] beforeinstallprompt event was fired');
					// Prevent Chrome 67 and earlier from automaticalßly showing the prompt
					e.preventDefault();
					// Stash the event so it can be triggered later.
					deferredPrompt = e;
	
					// alert('beforeinstallprompt was fired !!')
					btnAdd.style.display = 'block';
			});
			btnAdd.addEventListener('click', (e) => {
					// hide our user interface that shows our A2HS button
					btnAdd.style.display = 'none';
					// Show the prompt
					deferredPrompt.prompt();
					// Wait for the user to respond to the prompt
					deferredPrompt.userChoice
							.then((choiceResult) => {
									if (choiceResult.outcome === 'accepted') {
											console.log('[UI] User accepted the A2HS prompt');
									} else {
											console.log('[UI] User dismissed the A2HS prompt');
									}
									deferredPrompt = null;
							});
			});
		*/

	// offline-plugin runtimeによるSWイベントの受信・・・SWにキャッシュを消させる処理のトリガーである上のonupdatefoundイベントを横取りするのでこの機能はコメントアウトしてる・・・もし使うなら上のハンドラのようにSW側へMessageをPostするコードを入れてリソースの変更反映を確実にするようにする
	//
	/*   const runtime = require('offline-plugin/runtime');
	
			runtime.install({
					onUpdating: () => {
							alert('[UI] SW Event detected: onUpdating in runtime', 'onUpdating');
					},
					onUpdateReady: () => {
							alert('[UI] SW Event detected: onUpdateReady in runtime', 'onUpdateReady');
							// Tells to new SW to take control immediately
							runtime.applyUpdate();
					},
					onUpdated: () => {
							alert('[UI] SW Event detected: onUpdated in runtime', 'onUpdated');
							// 新SWのアップデートイベントでページをリロードさせる
							window.location.reload();         
					},
	
					onUpdateFailed: () => {
							alert('[UI] SW Event detected: onUpdateFailed in runtime', 'onUpdateFailed');
					}
			}); */

	/* cache jQuery objects */
	var slideshow = $('.cd-slideshow'), slides = slideshow.children('li'), navigation = $('.cd-slideshow-nav');
	var mq = windowWidth(slideshow.get(0)), bindToggle = false;

	navigation.on('click', '.cd-nav-trigger', function(){
		navigation.toggleClass('nav-open');
	});

	navigation.on('click', 'a', function(event){
		navigation.toggleClass('nav-open');
	});

	function windowWidth(element) {
		var mq = window.getComputedStyle(element, '::before').getPropertyValue('content').replace(/["']/g, '');
		return mq;
	}

	bindEvents(mq);
	function bindEvents(MQ) {
    	if( MQ === 'desktop') {
    			$('#L1').attr('src', './images/2-2.png');
    			$('#L2').attr('src', './images/2-3-1.png');
    			$('#L3').attr('src', './images/2-3-2.png');
		} else if( MQ === 'mobile' ) {
			$('#L1').attr('src', './images/2-2m.png');
	    		$('#L2').attr('src', './images/2-3-1m.png');
    			$('#L3').attr('src', './images/2-3-2m.png');
		}
	}
}); /* end of $(document).ready */
