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
    "positivos_residentes_dia",
    "altas_residentes_dia",
    "fallecidos_residentes_dia",
    "positivos_residentes_acumulado",
    "altas_residentes_acumulado",
    "fallecidos_residentes_acumulado",
    "positivos_no_residentes_dia",
    "altas_no_residentes_dia",
    "fallecidos_no_residentes_dia",
    "positivos_no_residentes_acumulado",
    "altas_no_residentes_acumulado",
    "fallecidos_no_residentes_acumulado",
    "vacunas_total_aplicaciones",
    "vacunas_total_aplicacion_dosis_1",
    "vacunas_total_aplicacion_dosis_2",
  ];

  let dataCABA = {};

  for (const iFrame of iframePages) {
    let page = await browser.newPage();
    await page.goto(rootPage + iFrame);
    await page.waitForSelector("h2");
    let value = await page.$eval("h2 > b", (value) => value.textContent);
    dataCABA[iFrame] = parseInt(value.replace(/\./g, ""));
  }

  await browser.close();

  return dataCABA;
};

// Para correr el servicio localmente
// (async () => {
//   const data = await scrapArgentina();
//   const dataCABA = await scrapCABA();

//   console.log({ argentina: data, caba: dataCABA });
// })();