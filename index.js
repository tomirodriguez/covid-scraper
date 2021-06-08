const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(
    "https://coronavirus.msal.gov.ar/publico/d/20as/sala-de-situacion-coronavirus-acceso-publico/d/20as/sala-de-situacion-coronavirus-acceso-publico?orgId=1&refresh=30m%2Flogin"
  );

  await page.waitForSelector(".singlestat-panel-value");

  const statisticsValues = await page.$$eval(
    // ".singlestat-panel-value > span",
    ".singlestat-panel-value",
    (fields) => fields.map((field) => field.textContent)
  );

  const valuesParsed = {
    lastUpdate: new Date(statisticsValues[0]),
    casesOfTheDay: parseInt(statisticsValues[1]),
    totalCases: parseInt(statisticsValues[2]),
    totalActiveCases: parseInt(statisticsValues[3]),
    totalRecovered: parseInt(statisticsValues[4]),
    deathOfTheDay: parseInt(statisticsValues[5]),
    totalDeath: parseInt(statisticsValues[6]),
    testsOfTheDay: parseInt(statisticsValues[7]),
    totalTests: parseInt(statisticsValues[8]),
    intensiveTherapy: parseInt(statisticsValues[9]),
    intensiveTherapyNationPercentage: parseFloat(
      statisticsValues[10].replace("%", "")
    ),
    intensiveTherapyAMBAPercentage: parseFloat(
      statisticsValues[11].replace("%", "")
    ),
  };

  console.log(valuesParsed);

  const tablesValues = await page.$$eval(".table-panel-table", (tables) =>
    tables.map((table) => {
      const tableValues = [];
      table.querySelectorAll("tr").forEach((row) => {
        const valuesInRow = Array.from(row.querySelectorAll("td"));
        valuesInRow.forEach((value) =>
          tableValues.push(
            value.textContent
              .replace("Provincia", "")
              .replace("Confirmados del día", "")
              .replace("Totales", "")
              .trim()
          )
        );
      });
      return tableValues;
    })
  );

  const parsedTable = [];

  for (let i = 0; i < tablesValues[0].length; i) {
    parsedTable.push({
      province: tablesValues[0][i++],
      casesOfTheDay: parseInt(tablesValues[0][i++]),
      totalCases: parseInt(tablesValues[0][i++]),
    });
  }

  await browser.close();
})();
