const auth_link = "https://www.strava.com/oauth/token";
var AllRunsThisYear = [];
const currentYear = new Date().getFullYear();//this year
const firstDayOfYear = new Date(`${currentYear}-01-01T00:00:00Z`);//
const timestamp = Math.floor(firstDayOfYear.getTime() / 1000);
var EddingtonNumber = 0;


// Assume you have a variable that determines whether to show the styles
let showCardTitle = false; // Set this variable as needed

// Get all the elements that match the selector
const cardTitleSmall = document.querySelectorAll('#dashboard-cards .card .card-title h2 small');

// Conditionally apply the style based on the variable
if (showCardTitle) {
    cardTitleSmall.forEach(text => text.style.display = 'block'); // Show the elements
} else {
    cardTitleSmall.forEach(text => text.style.display = 'none');  // Hide the elements
}




//let longestStreak = 0;
//let currentStreak = 1;


document.addEventListener('DOMContentLoaded', () => {

    // Check if the URL contains the authorization code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        console.log("code: "+ code)
        // If there's a code, use it to authorize
        reAuthorize(code);
    }
});

//Pick up refresh token
function reAuthorize(code) {
    fetch(auth_link, {
        method: 'POST',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: '55030',
            client_secret: 'c7f68f9b2f566b1498f72b615a6e64c79c4a3493',
            code: code,
            scope: "read, activity: read_all"
           // grant_type: 'refresh_token'
        })
    })
        .then(res => res.json())
        .then(res => getActivities(res))
       // .then(res => getActivitieLastYear(res));
}

//fetch activities using Refresh token
async function getActivities(res) {
    const activitiesPerPage = 200;
    const activity_type = 'Run';
    const allRuns = [];


    for (let page = 1; page <= 2; page++) {
        const activities_link = `https://www.strava.com/api/v3/athlete/activities?&after=${timestamp}&per_page=${activitiesPerPage}&page=${page}&access_token=${res.access_token}`;
        try {
            const response = await fetch(activities_link);
            if (response.status !== 200) throw new Error(response.statusText);
            const data = await response.json();
            const runs = data.filter(activity => activity.type === activity_type);
            allRuns.push(...runs);
        } catch (error) {
            console.error('Error fetching data:', error);
            const errorElement = document.getElementById('error');
            errorElement.textContent = 'Something went wrong while fetching data: ' + error;
        }
    }
 //   console.log("All runs: " + JSON.stringify(allRuns))
    calculateEddingtonNumber(allRuns);
  //console.log("Longest streak1: "+longestStreak)
    longestStreak = calculateLongestRunStreak(allRuns)
    calculateKudos(allRuns);
  //console.log("Longest streak2: " + longestStreak)

}

async function getActivitieLastYear(res) {
    const activitiesPerPage = 200;
    const activity_type = 'Run';
    const allRunsLastYear = [];


    for (let page = 1; page <= 4; page++) {
        const activities_link = `https://www.strava.com/api/v3/athlete/activities?&after=1672531200&before=1704067199&per_page=${activitiesPerPage}&page=${page}&access_token=${res.access_token}`;
        try {
            const response = await fetch(activities_link);
            if (response.status !== 200) throw new Error(response.statusText);
            const data = await response.json();
            const runs = data.filter(activity => activity.type === activity_type);
            allRunsLastYear.push(...runs);
           // console.log("allRunsLastYear"+allRunsLastYear);
        } catch (error) {
            //console.error('Error fetching data:', error);
            const errorElement = document.getElementById('error');
            errorElement.textContent = 'Something went wrong while fetching data: ' + error;
        }
    }
}

function calculateEddingtonNumber(runs) {
    // Group runs by date with their respective distances and names
    const runsByDate = runs.reduce((acc, run) => {
        const date = run.start_date_local.split('T')[0];
        const distance = run.distance / 1000;
        const name = run.name;

        if (!acc[date]) acc[date] = [];

        acc[date].push({ date, distance, name });

        return acc;
    }, {});

    // Convert the runsByDate object to an array of run objects
    const runsArray = Object.values(runsByDate).flat();
   //onsole.log("runsArray:", runsArray); // This will log the array of run objects with date, distance, and name

    // Sort distances in descending order
    const dailyDistances = runsArray.map(run => run.distance).sort((a, b) => b - a);

    // Calculate the Eddington Number
    let eddingtonNumber = 0;
    for (let i = 0; i < dailyDistances.length; i++) {
        if (dailyDistances[i] >= i + 1) {
            eddingtonNumber = i + 1;
        } else {
            break;
        }
    }

    // Calculate how many more runs are needed to reach the next Eddington Number
    const nextEddingtonTarget = eddingtonNumber + 1;
    const currentDaysAtTarget = dailyDistances.filter(dist => dist >= nextEddingtonTarget).length;
    const runsNeeded = nextEddingtonTarget - currentDaysAtTarget;

    // Filter and sort runs that contribute to the next Eddington target
    const sortedRuns = runsArray.sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date

    // Debug: Check sorted runs
    //nsole.log("Sorted Runs:", sortedRuns);

    // Aggregate runs to meet the target
    const requiredRuns = sortedRuns.filter(run => run.distance >= nextEddingtonTarget);

    // Debug: Check the number of runs added
   //onsole.log("Required Runs:", requiredRuns.length);

    // Update the HTML with the Eddington number and runs needed
    const eddingtonNumberElement = document.getElementById('eddingtonNumber');
    const nextEddingtonTargetElements = document.querySelectorAll('#nextEddingtonTarget');
    const runsNeededElement = document.getElementById('runsNeeded');
    const nextEddingtonTargetList = document.querySelector('.nextEddingtonTarget-list');

    eddingtonNumberElement.textContent = eddingtonNumber;
    nextEddingtonTargetElements.forEach(element => {
        element.textContent = nextEddingtonTarget;
    });
    runsNeededElement.textContent = runsNeeded;

    // Update the list of runs in the HTML
    nextEddingtonTargetList.innerHTML = ''; // Clear existing list items
    requiredRuns.forEach(run => {
        const listItem = document.createElement('li');
        const formattedDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(run.date));
        const formattedDistance = run.distance.toFixed(2);
        listItem.textContent = `${run.name} - ${formattedDate} - ${formattedDistance} km`;
        nextEddingtonTargetList.appendChild(listItem);
    });
}




function calculateLongestRunStreak(Allruns) {
    if (Allruns.length === 0) return { longestStreak: 0, longestStreakRuns: [] };

    let longestStreak = 0;
    let currentStreak = 1;
    let currentStreakRuns = [Allruns[0]]; // Start with the first run
    let longestStreakRuns = [];
    let allStreakRuns = [Allruns[0]]; // To include all runs in streak, even on the same day

    // Normalize the first run date
    let previousRunDate = new Date(Allruns[0].start_date_local);
    previousRunDate.setHours(0, 0, 0, 0); // Normalize to just the date part

    for (let i = 1; i < Allruns.length; i++) {
        let currentRunDate = new Date(Allruns[i].start_date_local);
        currentRunDate.setHours(0, 0, 0, 0); // Normalize to just the date part

        // Calculate the difference in days between current and previous run
        let diffInTime = currentRunDate.getTime() - previousRunDate.getTime();
        let diffInDays = diffInTime / (1000 * 3600 * 24);

        if (diffInDays === 1) {
            // If the run is exactly the next day, increment the streak
            currentStreak++;
            currentStreakRuns.push(Allruns[i]); // Add the current run to the streak
            allStreakRuns.push(Allruns[i]); // Add the current run to the list that contains all streak runs
        } else if (diffInDays === 0) {
            // If the run is on the same day, add it to the streak but don't reset
            allStreakRuns.push(Allruns[i]);
        } else if (diffInDays > 1) {
            // If the run is not the next day, compare and reset the streak
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
                longestStreakRuns = [...currentStreakRuns]; // Save the runs in the longest streak
            }

            // Reset streak
            currentStreak = 1;
            currentStreakRuns = [Allruns[i]]; // Start a new streak with the current run
            allStreakRuns = [Allruns[i]]; // Reset the list of all streak runs
        }

        // Update previous run date to the current one
        previousRunDate = currentRunDate;
    }

    // Final check after loop
    if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        longestStreakRuns = [...currentStreakRuns];
        allStreakRuns = [...currentStreakRuns]; // Ensure all streak runs are included
    }

    // Update the DOM elements with the result
    const longestStreakElements = document.querySelectorAll("#longestStreak");
    longestStreakElements.forEach(element => {
        element.textContent = longestStreak;
    });

    // Generate and insert the list items for all runs in the longest streak, including those on the same day
    const taskList = document.querySelector('.streak-list');
    taskList.innerHTML = ''; // Clear existing list items

    longestStreakRuns.forEach(run => {
        const listItem = document.createElement('li');
        listItem.textContent = `${new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(run.start_date_local))} - ${(run.distance / 1000).toFixed(2)} km`;

        taskList.appendChild(listItem);
    });

    return { longestStreak, longestStreakRuns };
}
function calculateKudos(runList) {
    let total_kudos = 0;
    let total_activities = 0;
    let top_kudos = 0;
    let top_run = null; // Changed to null to handle case when no runs exist

    // Calculate total kudos, number of activities, and identify the top kudos run
    runList.forEach(run => {
        total_kudos += run.kudos_count;
        if (run.kudos_count > top_kudos) {
            top_kudos = run.kudos_count;
            top_run = {
                name: run.name,
                date: run.start_date_local,
                distance: run.distance,
            };
        }
    });

    // Update the total activities count
    total_activities = runList.length;

    // Calculate the ratio
    const kudos_ratio = total_activities > 0 ? (total_kudos / total_activities) : 0;

    // Update the HTML elements with the calculated values
    const averageKudosElements = document.querySelectorAll("#averageKudos");
    averageKudosElements.forEach(element => {
        element.textContent = kudos_ratio.toFixed(2);
    });

    const topKudosElement = document.getElementById("top_kudos");
    topKudosElement.textContent = top_kudos;

    const kudosList = document.querySelector(".kudos-list");
    if (kudosList) {
        kudosList.innerHTML = ''; // Clear existing content

        if (top_run) {
            const listItem = document.createElement('li');
            listItem.textContent = `${new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(top_run.date))} - ${top_run.name} - ${(top_run.distance / 1000).toFixed(2)} km`;
            kudosList.appendChild(listItem);
        } else {
            const listItem = document.createElement('li');
            listItem.textContent = 'No runs available.';
            kudosList.appendChild(listItem);
        }
    }

    // Log the results to the console
    console.log("Total Kudos: " + total_kudos + " | Runs/Kudos Ratio: " + kudos_ratio.toFixed(2) + " | Top Kudos: " + top_kudos + " | Top Run: " + JSON.stringify(top_run));
}



//tiles stuff

$(document).ready(function () {
    var zindex = 10;

    $("div.card").click(function (e) {
        e.preventDefault();

        var isShowing = false;

        if ($(this).hasClass("d-card-show")) {
            isShowing = true
        }

        if ($("div.dashboard-cards").hasClass("showing")) {
            // a card is already in view
            $("div.card.d-card-show")
                .removeClass("d-card-show");

            if (isShowing) {
                // this card was showing - reset the grid
                $("div.dashboard-cards")
                    .removeClass("showing");
            } else {
                // this card isn't showing - get in with it
                $(this)
                    .css({ zIndex: zindex })
                    .addClass("d-card-show");

            }

            zindex++;

        } else {
            // no dashboard-cards in view
            $("div.dashboard-cards")
                .addClass("showing");
            $(this)
                .css({ zIndex: zindex })
                .addClass("d-card-show");

            zindex++;
        }

    });

    //Updates the label text based on the toggle's state.
    const toggle = document.getElementById('toggle');
    const run_rideLabels = document.querySelectorAll('#run_ride-label');
    const running_cyclingLabels = document.querySelectorAll('#running_cycling-label');

    toggle.addEventListener('change', function () {
        if (this.checked) {
            run_rideLabels.forEach(label => label.textContent = 'run');
            running_cyclingLabels.forEach(label => label.textContent = 'running');
        } else {
            run_rideLabels.forEach(label => label.textContent = 'ride');
            running_cyclingLabels.forEach(label => label.textContent = 'cycling');
        }
    });
});
