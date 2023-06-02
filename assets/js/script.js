const searchBtn = document.getElementById("search-button");
const clearBtn = document.getElementById("clear-button");

var chartContainer = document.getElementById("myChart");
var newsPanel = document.getElementById("newsPanel");
var historyPanel = document.getElementById("historyPanel");

var stockSuccess = true;
var newsSuccess = true;

function CreateChart(dates, data1, label1, data2, label2) {
  var stockChart = document.createElement("canvas");

  new Chart(stockChart, {
    type: "line",
    data: {
      labels: dates,

      datasets: [
        {
          label: label1,
          data: data1,
          borderWidth: 2,
          borderColor: "#4C5CA2",
        },
        {
          label: label2,
          data: data2,
          borderWidth: 2,
          borderColor: "#8A6FC4",
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
        },
      },
    },
  });

  chartContainer.appendChild(stockChart);
}

async function getStockData(stocksTicker, from, to) {
  const APIKEY = "79G4QU6AaADL93J2chBjRQKru3lIvD8z";
  const Aggregates = "https://api.polygon.io/v2/aggs/ticker";

  var url = `${Aggregates}/${stocksTicker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=120&apiKey=${APIKEY}`;

  var response = await fetch(url);

  if (response.status == 200) {
    var data = await response.json();

    return {
      code: response.status,
      arr: data.results,
    };
  } else {
    return {
      code: response.status,
      arr: [],
    };
  }
}

function correlation(arr1, arr2) {
  function sum(arr) {
    var sum = 0;

    for (var i = 0; i < arr.length; i++) {
      sum += arr[i];
    }

    return sum;
  }

  function multiSum(xArr, yArr) {
    var sum = 0;

    for (var i = 0; i < xArr.length; i++) {
      sum += xArr[i] * yArr[i];
    }

    return sum;
  }

  function squareSum(arr) {
    return multiSum(arr, arr);
  }

  const n = arr1.length;

  const nominator = n * multiSum(arr1, arr2) - sum(arr1) * sum(arr2);
  const denominator = Math.sqrt(
    (n * squareSum(arr1) - sum(arr1) * sum(arr1)) *
      (n * squareSum(arr2) - sum(arr2) * sum(arr2))
  );

  return nominator / denominator;
}

function analysis(corr) {
  if (corr < -0.8) {
    return `Very strong negative correlation (${corr.toFixed(2)}) between`;
  } else if (corr > -0.8 && corr <= -0.5) {
    return `Strong negative correlation (${corr.toFixed(2)}) between`;
  } else if (corr > -0.5 && corr <= -0.2) {
    return `Fair negative correlation (${corr.toFixed(2)}) between`;
  } else if (corr > -0.2 && corr <= -0.05) {
    return `Weak negative correlation (${corr.toFixed(2)}) between`;
  } else if (corr > -0.05 && corr < 0.05) {
    return `Almost no correlation (${corr.toFixed(2)}) between`;
  } else if (corr >= 0.05 && corr < 0.2) {
    return `Weak positive correlation (${corr.toFixed(2)}) between`;
  } else if (corr >= 0.2 && corr < 0.5) {
    return `Fair positive correlation (${corr.toFixed(2)}) between`;
  } else if (corr >= 0.5 && corr < 0.8) {
    return `Strong positive correlation (${corr.toFixed(2)}) between`;
  } else if (corr >= 0.8) {
    return `Very strong positive correlation (${corr.toFixed(2)}) between`;
  }
}

async function createCompareCharts(stock, compare, from, to) {
  while (chartContainer.firstChild) {
    chartContainer.removeChild(chartContainer.firstChild);
  }

  const stockObj = await getStockData(stock, from, to);
  const compareObj = await getStockData(compare, from, to);

  if (
    stockObj.code == 200 &&
    stockObj.arr &&
    compareObj.code == 200 &&
    compareObj.arr
  ) {
    const stockData = stockObj.arr;
    const compareData = compareObj.arr;

    const dates = stockData.map((data) => dayjs(data.t).format("M/D"));

    const stockClose = stockData.map((data) => data.c);
    const compareClose = compareData.map((data) => data.c);

    var chartTitle = document.createElement("h2");
    chartTitle.textContent = `Prices of ${stock}`;

    chartContainer.appendChild(chartTitle);

    CreateChart(dates, stockClose, stock, compareClose, compare);

    var coefficient = correlation(stockClose, compareClose);
    const report = analysis(coefficient);

    var correlateText = document.createElement("p");
    correlateText.textContent = `${report} ${stock} and ${compare} in the period.`;

    chartContainer.appendChild(correlateText);

    createComparePanel(stock, from, to);
  } else {
    var errorMsg = document.createElement("h1");
    errorMsg.textContent = "Error fetching stock : chart cannot be created";
    chartContainer.appendChild(errorMsg);
  }
}

function createComparePanel(stocksTicker, from, to) {
  var comparePanel = document.createElement("div");
  comparePanel.setAttribute("id", "comparePanel");
  comparePanel.setAttribute("style", "margin-top: 20px;");
  chartContainer.appendChild(comparePanel);

  var compareLabel = document.createElement("label");
  compareLabel.setAttribute("for", "compare-stock");
  compareLabel.textContent = `Compare ${stocksTicker} with `;
  comparePanel.appendChild(compareLabel);

  var compareStock = document.createElement("input");
  compareStock.setAttribute("id", "compare-stock");
  compareStock.setAttribute("placeholder", "Enter stock name...");
  comparePanel.appendChild(compareStock);

  var compareBtn = document.createElement("button");
  compareBtn.setAttribute("id", "compare-button");
  compareBtn.textContent = "Compare";
  comparePanel.appendChild(compareBtn);

  compareBtn.addEventListener("click", () => {
    if (compareStock.value) {
      const compareTicker = compareStock.value.toUpperCase();
      createCompareCharts(stocksTicker, compareTicker, from, to);
    }
  });
}

async function DisplayStockData(stocksTicker, from, to) {
  while (chartContainer.firstChild) {
    chartContainer.removeChild(chartContainer.firstChild);
  }

  const dataObj = await getStockData(stocksTicker, from, to);

  if (dataObj.code == 200 && dataObj.arr && dataObj.arr.length > 1) {
    const data = dataObj.arr;

    const dates = data.map((entry) => dayjs(entry.t).format("M/D"));
    const open = data.map((entry) => entry.o);
    const close = data.map((entry) => entry.c);

    var chartTitle = document.createElement("h2");
    chartTitle.textContent = `Prices of ${stocksTicker} (${from} to ${to})`;

    chartContainer.appendChild(chartTitle);
    CreateChart(dates, close, "close price", open, "open price");

    stockSuccess = true;

    createComparePanel(stocksTicker, from, to);
  } else {
    var errorMsg = document.createElement("h1");
    errorMsg.textContent = "Error fetching stock : chart cannot be created";
    chartContainer.appendChild(errorMsg);
    stockSuccess = false;
  }
}

async function getNews(stocksTicker, from, to) {
  const APIKEY = "79G4QU6AaADL93J2chBjRQKru3lIvD8z";
  const News = "https://api.polygon.io/v2/reference/news";

  var url = `${News}?ticker=${stocksTicker}&published_utc.gte=${from}&published_utc.lte=${to}&order=desc&limit=100&apiKey=${APIKEY}`;

  var response = await fetch(url);

  if (response.status == 200) {
    var data = await response.json();

    return {
      code: response.status,
      arr: data.results,
    };
  } else {
    return {
      code: response.status,
      arr: [],
    };
  }
}

function createNewsBox(data) {
  var dates = [];
  var index = [];

  for (var i = 0; i < data.length; i++) {
    var date = data[i].published_utc.slice(0, 10);
    if (!dates.includes(date)) {
      dates.push(date);
      index.push(i);
    }
  }

  for (var i = 0; i < data.length; i++) {
    var newsBox = document.createElement("div");
    newsBox.setAttribute("class", "news-box");

    if (index.includes(i)) {
      var newsDate = document.createElement("h3");
      newsDate.textContent = `${data[i].published_utc.slice(0, 10)}`;
      newsPanel.appendChild(newsDate);
    }

    var newsTitle = document.createElement("h4");
    newsTitle.textContent = `${data[i].title}`;

    var newsURL = document.createElement("a");
    newsURL.textContent = "Link to the news";
    newsURL.setAttribute("href", data[i].article_url);
    newsURL.setAttribute("target", "_blank");

    newsBox.appendChild(newsTitle);
    newsBox.appendChild(newsURL);

    newsBox.setAttribute("style", "border-radius: 10px");

    newsPanel.appendChild(newsBox);
    newsPanel.setAttribute("style", "height: 80vh; overflow: auto;");
  }
}

async function DisplayNews(stocksTicker, from, to) {
  while (newsPanel.firstChild) {
    newsPanel.removeChild(newsPanel.firstChild);
  }

  const newsObj = await getNews(stocksTicker, from, to);

  if (
    newsObj.code == 200 &&
    newsObj.arr &&
    newsObj.arr.length > 0 &&
    stockSuccess
  ) {
    createNewsBox(newsObj.arr);
    newsSuccess = true;
  } else {
    var errorMsg = document.createElement("h1");
    errorMsg.textContent = "Error fetching news: no news can be fetched";
    newsPanel.appendChild(errorMsg);
    newsSuccess = false;
  }
}

/*
async function getStockInfo(stocksTicker) {
  const APIKEY = "79G4QU6AaADL93J2chBjRQKru3lIvD8z";
  const TicketDetails = "https://api.polygon.io/v3/reference/tickers";

  var url = `${TicketDetails}/${stocksTicker}?apiKey=${APIKEY}`;

  var response = await fetch(url);
  var data = await response.json();

  return {
    name: data.results.name,
    iconURL: data.results.branding.logo_url + `?apiKey=${APIKEY}`,
  };
}*/

function updateTickerHistory(tickerHistory) {
  while (historyPanel.firstChild) {
    historyPanel.removeChild(historyPanel.firstChild);
  }

  for (var i = tickerHistory.length - 1; i >= 0; i--) {
    var historyBox = document.createElement("button");
    historyBox.setAttribute("class", "history-box");

    historyBox.textContent = tickerHistory[i];

    historyBox.setAttribute("data-stock", tickerHistory[i]);

    historyBox.setAttribute("style", "border-radius: 10px; width: 95%;");

    historyBox.addEventListener("click", async function () {
      const stockName = this.dataset.stock;

      const startDate = dayjs().subtract(14, "day").format("YYYY-MM-DD");
      const endDate = dayjs().format("YYYY-MM-DD");

      await DisplayStockData(stockName, startDate, endDate);
      await DisplayNews(stockName, startDate, endDate);
    });

    historyPanel.appendChild(historyBox);
    historyPanel.setAttribute("style", "overflow: auto;");
  }
}

clearBtn.addEventListener("click", function () {
  localStorage.removeItem("tickerHistory");
  updateTickerHistory([]);
});

function errorWithoutInput() {
  while (chartContainer.firstChild) {
    chartContainer.removeChild(chartContainer.firstChild);
  }

  while (newsPanel.firstChild) {
    newsPanel.removeChild(newsPanel.firstChild);
  }

  var errorMsg = document.createElement("h1");
  errorMsg.textContent =
    "Check if you have entered the name of the stock and selected the start date and end date.";

  chartContainer.appendChild(errorMsg);
}

function changeDateFormat(date) {
  const dateArr = date.split("/");
  const month = dateArr[0];
  const day = dateArr[1];
  const year = dateArr[2];

  return `${year}-${month}-${day}`;
}

searchBtn.addEventListener("click", async function () {
  stockSuccess = true;
  newsSuccess = true;

  var tickerHistory = [];
  if (localStorage.getItem("tickerHistory")) {
    tickerHistory = JSON.parse(localStorage.getItem("tickerHistory"));
  }

  var stockName = document.getElementById("stock-input").value.toUpperCase();
  var startDate = changeDateFormat(
    document.getElementById("start-date-input").value
  );
  var endDate = changeDateFormat(
    document.getElementById("end-date-input").value
  );

  document.getElementById("stock-input").value = "";
  document.getElementById("start-date-input").value = "";
  document.getElementById("end-date-input").value = "";

  if (stockName && startDate && endDate) {
    await DisplayStockData(stockName, startDate, endDate);
    await DisplayNews(stockName, startDate, endDate);

    if (stockSuccess && newsSuccess && !tickerHistory.includes(stockName)) {
      tickerHistory.push(stockName);
      localStorage.setItem("tickerHistory", JSON.stringify(tickerHistory));
      updateTickerHistory(tickerHistory);
    }
  } else {
    errorWithoutInput();
  }
});

window.addEventListener("DOMContentLoaded", async function () {
  stockSuccess = true;
  newsSuccess = true;

  $("#start-date-input").datepicker();
  $("#end-date-input").datepicker();

  var tickerHistory = [];
  if (localStorage.getItem("tickerHistory")) {
    tickerHistory = JSON.parse(localStorage.getItem("tickerHistory"));
  }

  if (tickerHistory.length > 0) {
    const stockName = tickerHistory[tickerHistory.length - 1];
    const startDate = dayjs().subtract(14, "day").format("YYYY-MM-DD");
    const endDate = dayjs().format("YYYY-MM-DD");

    await DisplayStockData(stockName, startDate, endDate);
    await DisplayNews(stockName, startDate, endDate);

    updateTickerHistory(tickerHistory);
  } else {
    const startDate = dayjs().subtract(14, "day").format("YYYY-MM-DD");
    const endDate = dayjs().format("YYYY-MM-DD");

    await DisplayStockData("AAPL", startDate, endDate);
    await DisplayNews("AAPL", startDate, endDate);
  }
});
