const API_URL = "https://taylanpince.pythonanywhere.com";

class LeaderboardManager {
    constructor() {
        this.leaderboard = [];
        this.leaderboardWrapper = document.getElementById("leaderboard");

        this.loadLeaderboard();
    }

    loadLeaderboard() {
        fetch(API_URL).then((response) => {
            response.json().then((results) => {
            this.leaderboard = results;
            this.leaderboardWrapper.innerHTML = "";

            const leaderboardList = this.leaderboardWrapper.appendChild(document.createElement("ol"));

            for (let i = 0; i < this.leaderboard.length; i++) {
                const listItem = leaderboardList.appendChild(document.createElement("li"));
                const entry = this.leaderboard[i];

                listItem.innerHTML = entry.email + " " + entry.score;
            }
            });
        });
    }

    saveScore(score, email, address) {
        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({email: email, address: address, score: score})
        }).then((response) => {
            this.loadLeaderboard();
        });
    }
}

export { LeaderboardManager }