const puppeteer = require("puppeteer");

const scrapArgentina = async () => {
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

  return {
    lastUpdate: new Date(statisticsValues[0]),
    covidData: valuesParsed,
    provincesData: parsedTable,
  };
};

const scrapCABA = async () => {
  const browser = await puppeteer.launch();

  const rootPage = "https://bamapas.usig.buenosaires.gob.ar/render_indicador/";

  const iframePages = [
    { url: "positivos_residentes_dia", name: "Positivos Residentes" },
    { url: "altas_residentes_dia", name: "Altas Residentes" },
    { url: "fallecidos_residentes_dia", name: "Fallecidos Residentes" },
    {
      url: "positivos_residentes_acumulado",
      name: "Positivos Residentes Acumulado",
    },
    { url: "altas_residentes_acumulado", name: "Altas Residentes Acumulado" },
    {
      url: "fallecidos_residentes_acumulado",
      name: "Fallecidos Residentes Acumulado",
    },

    { url: "positivos_no_residentes_dia", name: "Positivos No Residentes" },
    { url: "altas_no_residentes_dia", name: "Altas No Residentes" },
    { url: "fallecidos_no_residentes_dia", name: "Fallecidos No Residentes" },
    {
      url: "positivos_no_residentes_acumulado",
      name: "Positivos No Residentes Acumulado",
    },
    {
      url: "altas_no_residentes_acumulado",
      name: "Altas No Residentes Acumulado",
    },
    {
      url: "fallecidos_no_residentes_acumulado",
      name: "Fallecidos No Residentes Acumulado",
    },
  ];

  let dataCABA = {};

  for (const iFrame of iframePages) {
    let page = await browser.newPage();
    await page.goto(rootPage + iFrame.url);
    await page.waitForSelector("h2");
    let value = await page.$eval("h2 > b", (value) => value.textContent);
    dataCABA[iFrame.name] = parseInt(value.replace(/\./g,''));
  }

  console.log(dataCABA);

  await browser.close();
};

// Para correr el servicio localmente
(async () => {
  const data = await scrapCABA();
})();
