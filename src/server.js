  //Подключение модулей
const express = require('express');
const fs = require('fs');
const path = require ('path');
const pug = require('pug');
const url = require('url')
const removeFs = require('fs-extra')
//init app
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');    // указываем используемый шаблонизатор HTML кода

const directory = '/home/smedov/Work/Test/';    //Указываем путь текущей дериктории

let userList = [
    { id: 1, name: 'Admin', login: 'Admin', password:"qwe"},
    { id: 2, name: 'TestUser', login: 'test', password:"123"},
    { id: 3, name: 'Serega', login: 'MRG_Serejka', password:"12345"},
    { id: 4, name: 'Artur', login: 'ARCHI', password:"qwerty"}
];


app.use(express.static(path.join(__dirname, 'public')));    //добовляет файлы которые на компьютере для загрузки если они имеются

//Главная страница
app.get('/', function (req, res) {//Главная страница
    const files = fs.readdirSync(directory);           //Прочитываем файлы из текущей директории

    for(let i=0; i<files.length;i++)               //убираем расширение
      {
        let name = path.basename(files[i], '.conf');
        files[i] = name;
      }

    let searchResult = req.query.search;    //присваиваем переменной результат запроса клиента


    const filterItems = (searchResult) => {             //фильтр Поискового окна
      return files.filter((el) =>
        el.indexOf(searchResult) > -1
      );
    }

    let filterList = filterItems(searchResult);             //присваиваем отфильтрованные переменные в одну переменную


    if(filterList!=''){
      res.render('index', { title: 'Directory', value: filterList});
    }else

    res.render('index', { title: 'Directory', value: files});       //рендерим файл index.pug
      });


    app.get('/delete', function(req, res) {          //  удаления файла из текущей директории
        const folder = directory+req.query.id+'.conf';
        console.log(folder)
        removeFs.remove(folder, err => {
          if(err) console.error(err),
          res.send("Файл " + req.query.id + " был успешно удален");
        })


    });





  app.get('/add', function(req, res){     //добавление

      let domain = req.query.domain;
      let fileName = directory + domain + '.conf'
      let ip = req.query.ip;
      let domenWithoutDots=domain.replace(/\./g, ""); //убираем точку глабально


      let fileContent = fs.readFileSync('/home/smedov/Work/Test/template.conf', "utf8");
      var newStr = fileContent.replace(/__DOMAINWITHOUTDOT__/g, domenWithoutDots).replace(/__DOMAIN__/g, domain).replace(/__IP_ADDRESS__/g,ip);

      //записываем в файл домен и ip
      fs.writeFile(fileName, newStr , function(error){
        if(error) throw error; //Использую инструкцию throw для генерирования исключения


        res.send("200");//выведем 200ок

      });
  });

app.get('/login', function(req, res){     //авторизация
    res.render('login', {title:'Вход'});
});

function check(userLogin)
  {
  for (let i=0 ; i< userList.length;i++)
      {
          if (userList[i].login === userLogin)
              {

              console.log(userList[i]);
              return userList[i];
              }
      }

  return false;
  }


  app.get('/getLogin', function (req, res) {    //авторизация
      let login = req.query.login
      let password = req.query.password
      const uniqueUser = check(login)

      if(password === uniqueUser.password){

            const out = {
                status: 1,
                token: 'supertoken-3213123123',
                str:req.query.login+'--'+req.query.password,
                name: req.query.login,
                user: uniqueUser.id
            }
          res.json(out)            //отправляю json формат на клиент
        }
        else{
      res.json({status:0})
    }
   });

   app.get('/admin',function(req, res){
     res.render('admin', {title:'Админка', userList:userList});
   });

   app.get('/ajax/admin', function(req, res){     //авторизация под админа
      let newUserLogin = req.query.login;
      let newUserName = req.query.name;
      let newUserPassword = req.query.password;
      console.log(newUserLogin)
      let user={
        id:userList.length+1,
        login : newUserLogin,
        name : newUserName,
        password : newUserPassword
      }
      userList.push(user)
      res.send("200");
   });




//запускаем сервер
app.listen(3000, function () {
    console.log ('Отслеживаем порт: 3000!');
});
