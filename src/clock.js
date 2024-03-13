window.onload = function () {

	const hourHand = document.querySelector('.hourHand');
	const minuteHand = document.querySelector('.minuteHand');
	const secondHand = document.querySelector('.secondHand');
	const time = document.querySelector('.time');
	const clock = document.querySelector('.clock');
	const audio = document.querySelector('.audio');

	const today = new Date();
	window.fakeSeconds = today.second;

	//	setInterval(() => window.fakeSeconds++, 1000);

	function setDate() {

		//const second = today.getSeconds();
		const second = Math.floor(window.fakeSeconds);
		if (window.fakeSeconds >= 60){
			window.fakeSeconds = 0;
		}
		const secondDeg = (((second % 60) / 60) * 360) + 360;
		secondHand.style.transform = `rotate(${secondDeg}deg)`;


		//const minute = today.getMinutes();
		const minute = Math.floor(second / 60);
		const minuteDeg = ((minute / 60) * 360);
		minuteHand.style.transform = `rotate(${minuteDeg}deg)`;

		const hour = Math.floor(minute / 60) % 12;
		const hourDeg = ((hour / 12) * 360);
		hourHand.style.transform = `rotate(${hourDeg}deg)`;

		time.innerHTML = '<span>' + '<strong>' + hour + '</strong>' + ' : ' + minute + ' : ' + '<small>' + second + '</small>' + '</span>';

	}

	setInterval(setDate, 100);
}
