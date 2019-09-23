  //Подключение модулей
  const express = require('express'); // подключаем express
  const fs = require('fs');
  const removeFs = require('fs-extra');
  const path = require('path'); //модуль path позволяет указывать пути к дирректориям
  const pug = require('pug'); // подключаем модуль шаблонизатора
  const cors = require('cors'); //модуль для axios
  const bodyParser = require('body-parser');
  const createError = require('http-errors') // модуль отлавливания ошибок
  const jwt = require('jsonwebtoken');  //модуль шифрования
  const bcrypt = require('bcrypt');//модуль для соли
  const { SHA3 } = require('sha3');//модуль хеширования SHA3
  const app = express(); //init app

  app.set('views', path.join(__dirname, 'views')); //указываем путь к pug файлам
  app.set('view engine', 'pug'); // указываем используемый шаблонизатор HTML кода

  app.use(bodyParser.urlencoded({
    extended: false
  }))
  app.use(bodyParser.json())

  app.use(cors());

  app.use(express.static(path.join(__dirname, 'public'))); //добовляет файлы которые на компьютере для загрузки если они имеются



  const MY_SECRET = "cAtwa1kkEy" // случайный секретный ключ
  const directory = '/home/smedov/Work/Test/'; //Указываем путь текущей дериктории
  let userList = [                    // массив пользователей
      { id: 1, status: 'Admin', name: 'Admin', login: 'Admin', password:"392de49fdf72a89b44ae61a4bc14501128f0a21f30984c8e80484781981d39ad",salt:"$2b$10$mAo9BxmMip..vK50xxB6he"},
      { id: 2, status: 'User', name: 'Igor', login: 'Amstel', password:"3ad55d87ad02469f64bf4e2348c74c179f6a295c02b151408689b1c13a1205b9",salt:"$2b$10$Kkz.LFXX3BHHMjYdkym6Tu"},
      { id: 3, status: 'User', name: 'Serega', login: 'MRG_Serejka', password:"6ab2d3047a7fb1fba804d6c2cd6cf056f62f3ad2bcdb7bf2fd2f0c6a1f5f9a2f",salt:"$2b$10$6jBpvDVVqB97xK/wKRaEte"},
      { id: 4, status: 'User', name: 'Artur', login: 'Archi', password:"02fdb9c93d5e14278a0ae4a320c79479fc8d9eb15d216210dbcf5ec3b7dc8cb2",salt:"$2b$10$9R8HTlrq6.w1eNUfGX3jY."},
      { id: 5, status: 'User', name: 'Elsa', login: 'Els@', password:"1bdaa56322529c32d1e6a3b671b406884e9d93c3d2c285fbae8e4c6896c40912",salt:"$2b$10$aQAU0HiEMOkuVQ8PDXrl.O"},
      { id: 6, status: 'User', name: 'Sanek', login: 'MRG_Sanek', password:"dc468812b8ae6c9281c4d87dc5462962f1574a3f290e807538a08733babf2ba1",salt:"$2b$10$9yL.byCRVXJXj49g7gDUIu"},
      { id: 7, status: 'User', name: 'Serega', login: 'GREY', password:"00b87e9b8f7d890fa512fb3b998b2c9e9d0c9538bc68f9181db53a1cae543292",salt:"$2b$10$aRXOtSeALhw2IF2uuuSW.O"},
      { id: 8, status: 'User', name: 'Irina', login: 'Beller', password:"d942f886b59d52489936c871f0809469490261ebbfb1384fa2d7a596c27b1447",salt:"$2b$10$WAf7WGAb8HBk8fNsRh5FVe"}
  ];

  let filesList = []  // массив для файлов

  let lengthArray = userList.length   // переменная хранящая длинну массива

    // ФУНКЦИИ Вспомогательные__________________________________________________

    function searchById(userList, id) {
      for (let i = 0; i < userList.length; i++) {
        if (userList[i].id == id) {
          return userList[i]
        }
      }
      return false
    };

    function loginСomparison(userList, login) {
      for (let i = 0; i < userList.length; i++) {
        if (userList[i].login === login) {
          return userList[i]
        }
      }
      return false
    };

    function hashUser(userPassword,salt) {
      const hash = new SHA3(256);
      hash.update(userPassword+salt);
      let hashUserPsw = hash.digest('hex');
      return hashUserPsw;
    }

//ФУНКЦИИ КОТОРЫМ НЕ НУЖЕН ТОКЕН ДЛЯ ВЫПОЛНЕНИЯ_________________________________
app.post('/ajax/users/dataChecking', function(req, res, next) {
  let userLogin = req.body.login; //name пользователя
  let userPassword = req.body.password; //password пользователя
  let checkUser = loginСomparison(userList, userLogin) //проверим есть ли такой пользоваль
  let salt = checkUser.salt
  let result = hashUser(userPassword,salt)

  if (checkUser && checkUser.password === result)  {
    let user = loginСomparison(userList, userLogin) //получаем Объект пользователя
    let token = jwt.sign({ id: user.id, login: user.login }, MY_SECRET); //хешируем токен используя секретный ключ

    res.json({
      token: token, // захешированный токен
      id: user.id,
      name: user.name,
      login: user.login,
      status: user.status
    })
  } else {
    return next(createError(400, 'Вы ввели неправильные логин или пароль'))
  }
})
//ОБРАБОТЧИК ПЕРЕХВАТЫВАЕТ ВСЕ ПУТИ_____________________________________________

app.use('*', function(req, res, next) {
  let token
  let result = (req.headers.authorization)
  if (result) token = result.substr(7) //вырежем слово baerer

  if (!token) { // приводим к булевному значению (если токена не существует)
    return next(createError(412, 'Токен не сушествует'))
  }

  let decoded = jwt.verify(token, MY_SECRET); // расшифруем токен
  if (!decoded) {
    return next(createError(416, 'Токен не валиден'))
  } else next()
})
//ФУНКЦИИ ДЛЯ КОТОРЫХ НУЖЕН ТОКЕН_______________________________________________
//_________USER___________________

app.get('/ajax/users', function(req, res,next) {
  res.json(userList) // рендерим массив пользователей
});


app.post('/ajax/users/deleteUser', function(req, res, next) { // удаление пользователей на стороне клиента
  let uniqueUserId = Number(req.body.id) // Id пользователя преобразованный как числовой тип данных
  let resultRemoveUser = searchById(userList, uniqueUserId) // функция аунтификации по id

  if (resultRemoveUser) {
    let userIndexReal = userList.indexOf(resultRemoveUser);
    userList.splice(userIndexReal, 1);
    res.json(userList)
  } else {
    return next(createError(400, 'Данного пользователя не cуществует'))
  }
})


app.post('/ajax/users/addUser', function(req, res, next) {
  let userName = req.body.name; //name пользователя
  let userLogin = req.body.login; //login пользователя
  let userPassword = req.body.password; //password пользователя
  let status = req.body.status
  if (status) {status="Admin"}
  else status = "User"

  const saltRounds = 10;
  let salt = bcrypt.genSaltSync(saltRounds);
  let result = hashUser(userPassword,salt)

  if (loginСomparison(userList, userLogin) == false && userName != '' && userLogin != '' && userPassword != '') {
    const newUserArr = {
      id: ++lengthArray,
      status: status,
      name: userName,
      login: userLogin,
      password: result,
      salt: salt
    }
    userList.push(newUserArr)
    res.json({
      userList
    });
  } else {
    return next(createError(400, 'Логин уже сушествует'))
    }
});

app.get('/ajax/users/giveUser', function(req, res, next) {
  let token
  let result = (req.headers.authorization)
  if (result) token = result.substr(7)
  let decoded = jwt.verify(token, MY_SECRET)
  userId = (decoded.id)
  let currentUser = searchById(userList, userId) // получаем юзера по ид
  console.log(currentUser)
  res.json({
    currentUser
  })
})

app.post('/ajax/users/changePassword', function(req, res, next) {
  let userId=req.body.userId
  let firstInput=req.body.newPass.firstInput
  let secondInput=req.body.newPass.secondInput
  let user = searchById(userList,userId)

  if(firstInput===secondInput && firstInput!='' && secondInput!='')  {
    let newPsw = firstInput

    const saltRounds = 10;
    let salt = bcrypt.genSaltSync(saltRounds);

    let result = hashUser(user.password,salt)
    user.salt = salt
    user.password = result
  }

  res.json({
    success: 1
  })
})

//______________FILES________________

app.get('/ajax/users/fileTable', function(req, res) {
  let files = fs.readdirSync(directory); //Прочитываем файлы из текущей директории
  let ipArr = []
  let domainArr = []
  let domenIpObj = [] // массив для хранения обьектов


  for (let i = 0; i < files.length; i++) //убираем расширение
  {
    let str = (fs.readFileSync(directory + files[i], 'utf8'));

    regexp = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}.[0-9]{1,3}/g
    let ip = str.match(regexp) || ['###IP Не указан###']

    ipArr.push(ip[0])

    let domain = path.basename(files[i], '.conf');
    domainArr.push(domain)

    domenIpObj[i] = { // заполним обьект
      ip: ipArr[i],
      domain: domainArr[i]
    }
  }

  filesList = domenIpObj
  res.json({
    domenIpObj
  })
})

app.post('/ajax/users/addFiles', function(req, res) { //добавление
  let domain = req.body.domain;
  let fileName = directory + domain + '.conf'
  let ip = req.body.ip;
  console.log(ip)
  let domenWithoutDots = domain.replace(/\./g, ""); //убираем точку глабально используя регулярные выражения

  let fileContent = fs.readFileSync('/home/smedov/Work/Test/template.conf', "utf8"); //считываем то что находиться в файле
  var newStr = fileContent.replace(/__DOMAINWITHOUTDOT__/g, domenWithoutDots).replace(/__DOMAIN__/g, domain).replace(/__IP_ADDRESS__/g, ip); //заменяем контекст в файле

  //записываем в файл домен и ip
  fs.writeFile(fileName, newStr, function(error) {
    if (error) throw error; //Использую инструкцию throw для генерирования исключения
  })
  res.json({
    success: 1
  })
});

app.post('/ajax/users/deleteFiles', function(req, res) { //  удаления файла из текущей директории
  const files = directory + req.body.files + '.conf';
  removeFs.remove(files, err => { //воспользуемся модулем fs-extra для удаления файла
    if (err) console.error(err)
  })
  res.json({
    success: 1
  })
});

//_______________FILTER________________________________________

app.post('/ajax/users/tableUserSearch', function(req, res) { //  удаления файла из текущей директории
     let newSearchList=[]
     let searchResult = req.body.filterInput.toLowerCase();

     newSearchList = userList.filter(function(elem) {
       if (
           elem.login.toLowerCase().indexOf(searchResult) != -1 ||
           elem.name.toLowerCase().indexOf(searchResult) != -1  ||
           String(elem.id).toLowerCase().indexOf(searchResult) != -1
           ) {
         return true;
       } else {
         return false;
       }
     });

       console.log(newSearchList)
    res.json({
      newSearchList
    })
});

app.post('/ajax/users/tableFilesSearch', function(req, res) { //  удаления файла из текущей директории
  let newSearchList = []
  let searchResult = req.body.filterInput.toLowerCase();

  newSearchList = filesList.filter(function(elem) {
    if (
      elem.domain.toLowerCase().indexOf(searchResult) != -1 ||
      elem.ip.toLowerCase().indexOf(searchResult) != -1
    ) {
      return true;
    } else {
      return false;
    }
  });
  console.log(newSearchList)

  res.json({
    newSearchList
  })
});


//ОТЛАВЛИВАЕМ ОШИБКИ ЗДЕСЬ
//Используется модуль http-errors_______________________________________________

app.use(function(req, res, next) { //ОТЛАВЛИВАЕМ ВСЕ НЕ СУЩЕСТВУЕЩИЕ ПУТИ И ВЫВЕДЕМ СООТВЕТСВУЮЩУЮ ОШИБКУ
  return next(createError(404, 'Api метод не существует'))
})

app.use(function(err, req, res, next) { //ВЫВЕДЕМ В NETWORK ОТФАРМАТИРОВАННОЕ СООЬЩЕНИЕ ОБ ОШИБКЕ
  res.status(err.statusCode || 500)
  res.json({
    success: 0,
    error: err,
    message: err.message
  })
})

//запускаем сервер
app.listen(3000, function() {
  console.log('Отслеживаем порт: 3000!');
});
