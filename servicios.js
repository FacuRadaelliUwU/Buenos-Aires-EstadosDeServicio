const https = require('https');
const cheerio = require('cheerio');
const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

// Endpoint para obtener el estado de los trenes
app.get('/estado/trenes', (req, res) => {
  const url = 'https://www.argentina.gob.ar/transporte/trenes-argentinos/modificaciones-en-el-servicio-y-novedades';

  https.get(url, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      const $ = cheerio.load(data);
      const parsedData = [];

      const lineaRocaTitle = $('h5').first().text().trim();
      const lineaRocaDescription = $('h5').first().next('p').text().trim();
      parsedData.push({ title: lineaRocaTitle, description: lineaRocaDescription });

      const alerts = $('.alert');

      alerts.each((index, element) => {
        const title = $(element).find('h5').text().trim();
        const description = $(element).find('p').text().trim();

        parsedData.push({ title, description });
      });

      res.json(parsedData);
    });
  }).on('error', (error) => {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  });
});

// Endpoint para obtener el estado de los subtes
app.get('/estado/subtes', async (req, res) => {
  try {
    const response = await axios.get('https://www.enelsubte.com/estado/');
    const $ = cheerio.load(response.data);

    const estadoSubtes = [];

    $('#tabla-estado tr').each((index, element) => {
      const linea = $(element).find('.pastilla').text().trim();
      const estado = $(element).find('.estado-subtes-estado').text().trim();

      estadoSubtes.push({ linea, estado });
    });

    const lastUpdated = $('td[colspan="3"] .timeago').attr('title');

    res.json({ estadoSubtes, lastUpdated });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint para obtener el estado del dólar
app.get('/estado/dolar', (req, res) => {
  const url = 'https://eleconomista.com.ar/especial/dolar';

  axios.get(url)
    .then(response => {
      const $ = cheerio.load(response.data);
      const results = [];

      $('div.row > div.col-md-4, div.row > div.col-lg-3').each((index, element) => {
        const title = $(element).find('h2.tit').text().trim();
        const compra = $(element).find('div.cot p:nth-child(1) span').text();
        const venta = $(element).find('div.cot p:nth-child(2) span').text();
        const date = $(element).find('p.date').text();
        const percent = $(element).find('h3.percent').text();

        const data = {
          title,
          compra,
          venta,
          date,
          percent
        };

        results.push(data);
      });

      res.json(results.slice(0, 7)); // Limitar los resultados a los primeros 7 elementos

    })
    .catch(error => {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

app.listen(port, () => {
  console.log(`API server is running on http://localhost:${port}`);
});
