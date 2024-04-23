const express = require('express');

const cors = require('cors');

const axios = require('axios');

const fs = require('fs');

const app = express()

const puerto = 8008

app.use(express.static('public'));


app.get('/', (req, res) => {
    res.sendFile('./public/index.html', { root: __dirname });
});

app.get('/descuentos', (req, res) => {
    res.sendFile('descuentos.json', { root: __dirname });
});

app.get('/carro', (req, res) => {
    res.sendFile('./public/carro.html', { root: __dirname });
});

/*let cacheProductos;
let tieneCacheDeProductos = false;*/ 

app.get('/api', async (req, res) => {
  try {

   /* if(tieneCacheDeProductos){
      console.log('productos recuperados desde el cache');
      res.json(cacheProductos);
      return
    }*/

    const [dataApi, descuentos] = await Promise.all([
      axios.get("https://fakestoreapi.com/products"),
      axios.get('http://localhost:8008/descuentos')
    ]);

    const [data, data2] = await Promise.all([
      dataApi.data,
      descuentos.data
    ]);

    data.forEach(item =>{
      item.booleano = false;
    })

    data2.forEach(item => {                   
      const objeto = data.find(obj => obj.id === item.id);
      if (objeto) {
        objeto.booleano = true;
        const descontado = (objeto.price * (item.descuento / 100)).toFixed(2);
        const final = (objeto.price - descontado).toFixed(2);
        objeto.precioFinal = parseFloat(final);
        objeto.descuento = parseFloat(item.descuento);
        objeto.montoDescontado = parseFloat(descontado);
      }
    });

      const response3 = await axios.post('http://localhost:8008/traducir', {
        objetos: data
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const traducido = await response3.data; //FUNCIONAAA*/

     /* cacheProductos = traducido;
      tieneCacheDeProductos = true;*/
      
      res.json(traducido); //envio los datos traidos desde la api, con los descuentos aplicados, lista para mostrar en el html
  } catch (error) {
      console.error('Error de axios:', error);
      res.status(500).json({ error: 'Error de axios' });
  }
});



app.listen (puerto, () =>{
    console.log(`Puerto ${puerto}`)
})

//traduccion
//no me funcionó node-google-translate-skidz, y la traduccion de google cloud es de pago, así que encontré esta alternativa en npm

const {translate} = require('@vitalets/google-translate-api');

app.use(cors())

app.use(express.json()) //parsea los jsons entrantes 

app.post('/compra', (req, res) => {
  const checkout = req.body;

  if (!checkout) {
    console.error('error alrecibir compra');
    res.status(400).json({error: 'error al recibir compra'});
    return;
  }

  fs.readFile('compras.json', 'utf8', (err, data) => {
    if (err) { 
        res.status(500).json({ error: 'error leyendo el json' });
        return;
    }

    try {
      let json = JSON.parse(data);


      let maxIdDeCompra = 0;
      json.forEach(item => {
        if (item[0] && item[0].idDeCompra && item[0].idDeCompra > maxIdDeCompra) {
          maxIdDeCompra = item[0].idDeCompra;
        }
      });

      checkout[0].idDeCompra = maxIdDeCompra + 1;

      checkout[0].precioTotal = parseFloat(checkout[0].precioTotal).toFixed(2);

      json.push(checkout);

      fs.writeFile('compras.json', JSON.stringify(json), 'utf8', (err) => {
        if (err) {
          res.status(500).json({ error: 'error escribiendo en el json' });
          return;
        }
        res.json({ message: 'compra añadida correctamente' });
      });
    } catch (error) {

      res.status(500).json({ error: 'error de fs' });
    }
  });
});

let tieneCacheDeTraduccion = false;
let cacheTraducido = null; // Guardo la traduccion en un cache de memoria del servidor que se reinicia cuando se cierra el sv, google quiere que pague y soy pobre profe perdon

app.post('/traducir', async (req, res) => {     //al momento de traducir hubo problemas debido a que las api te limitan la cantidad de requests
    try {                                       //también vi en la documentacion de esta api que dice: > Please note that maximum text length for single translation call is **5000** characters. In case of longer text you should split it on chunks
        const { objetos } = req.body;           //decidí hacerlo lo más eficiente posible buscando como unir todo en un solo string cada 5000 caracteres para hacer la menor cantidad de requests posibles.
                                                //una vez hecha la traduccion la guardo en una variable del servidor para reenviarla.
                                                //si no está en la memoria y la api tira error, se envían los objetos sin traducir.
          if (tieneCacheDeTraduccion) {
            console.log('Traduccion recuperada desde el cache');
            const objetoFinal = [];
            objetos.forEach((obj, index) => {
                objetoFinal.push({
                    ...obj,
                    title: cacheTraducido[index * 2],
                    description: cacheTraducido[index * 2 + 1] 
                });
            });
            res.json(objetoFinal);
            return;
        }

        
        const todosLosStrings = objetos.map(({ title, description }) => `${title}\n${description}`).join('\n'); //los uní a todos con un /n en medio del titulo y descripcion, y otro despues de esta para poder dividirlo

        const chunks = [];
        for (let i = 0; i < todosLosStrings.length; i += 5000) { //divido el string cada 5000 caracteres y meto estas divisiones en un array
          chunks.push(todosLosStrings.substring(i, i + 5000))
        }

        const chunksTraducidos = await Promise.all(chunks.map(chunk => translate(chunk, { from: 'en', to: 'es' }))) // con un map mando a traducir cada division dentro del array

        const textroTraducido = chunksTraducidos.map(chunk => chunk.text).join('') //concateno todas las divisiones de nuevo

        const textosTraducidos = textroTraducido.split('\n'); // las divido con el separador 

        cacheTraducido = textosTraducidos; 
        tieneCacheDeTraduccion = true;

        const objetoFinal = [];  //uno el objeto de nuevo
        objetos.forEach((obj, index) => { //
          objetoFinal.push({
            ...obj,
            title: textosTraducidos[index * 2],
            description: textosTraducidos[index * 2 + 1]
          });
        });



        res.json(objetoFinal);

      } catch (error) {
        console.error('Error traduciendo(seguramente limitacion de requests por IP), enviando objetos sin traducir:', error);
        res.json(req.body.objetos);
      }
});

