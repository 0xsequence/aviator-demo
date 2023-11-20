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

            for (let i = 0; i < Math.min(this.leaderboard.length, 5); i++) {
                const listItem = leaderboardList.appendChild(document.createElement("li"));
                const entry = this.leaderboard[i];

                listItem.innerHTML = "<mark>" + entry.email + "</mark><small>" + entry.score + "</small>";
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