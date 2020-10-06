'use strict';

const formSearch = document.querySelector('.form-search'),
  inputCitiesFrom = document.querySelector('.input__cities-from'),
  inputCitiesTo = document.querySelector('.input__cities-to'),
  inputDateDepart = document.querySelector('.input__date-depart'),
  dropDownCitiesFrom = document.querySelector('.dropdown__cities-from'),
  dropDownCitiesTo = document.querySelector('.dropdown__cities-to'),
  cheapestTicket = document.getElementById('cheapest-ticket'),
  otherCheapTickets = document.getElementById('other-cheap-tickets');

const citiesApi = 'database/cities.json',
  proxy  = 'https://cors-anywhere.herokuapp.com/',
  API_KEY = 'c7731388804ed3b1f1ea6e7cb6a70874',
  calendar = 'http://min-prices.aviasales.ru/calendar_preload',
  MAX_COUNT = 10;

let city = [];


const getData = (url, callback, reject = console.error) => {
  const request = new XMLHttpRequest();

  request.open('GET', url);

  request.addEventListener('readystatechange', () => {
    if (request.readyState !== 4) return;

    if (request.status === 200) {
      callback(request.response);
    } else {
      reject(request.state);
    }
  });

  request.send();
};

// const getData = async(url, callback, reject = console.error) => {

//   const request = await fetch(url);

//   if (!request.ok) {
//     throw new Error(`Ошибка по адресу ${url}, статус ошибки ${request}`)
//   }
//   return await request.json();
// };
 

const showCity = (input, list) => {
  list.textContent = '';

  if (input.value !== '') {
    const filterCity = city.filter((item) => {
      if (item.name){
        return item.name.toLowerCase().startsWith(input.value.toLowerCase());
      }
    });

    filterCity.forEach((item) => {
      const li = document.createElement('li');
      li.classList.add('dropdown__city');
      li.textContent = item.name;
      list.append(li);
    })  
  } 
};  

const selectCity = (event, input, list) => {
  if (event.target.tagName.toLowerCase() === 'li') {
    input.value = event.target.textContent;
    list.textContent = '';
  };
};

const getNameCity = (code) => {
  const objCity = city.find((item) => item.code === code)
  return objCity.name;
};

const getDate = (date) => {
    return new Date(date).toLocaleString('ru', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
}

const getChanges = (num) => {
  if (num) {
      return num ===1 ? 'С одной пересадкой' : 'С двумя пересадками';
  } else {
    return 'Без пересадок'
  }
};

const getLinkAviasales = (data) => {
  let link = 'https://www.aviasales.ru/search/';

  link += data.origin;

  const date = new Date(data.depart_date);

  const day = date.getDate();

  link += day < 10 ? '0' + day : day;

  const month = date.getMonth() + 1;

  link += month < 10 ? '0' + month : month;

  link += data.destination;

  return link + '1';
};

const createCard = (data) => {
  const ticket = document.createElement('article');
  ticket.classList.add('ticket');

  let deep = '';

  if (data) {
    deep = `
    <h3 class="agent">${data.gate}</h3>
    <div class="ticket__wrapper">
      <div class="left-side">
        <a href="${getLinkAviasales(data)}" target="_blank" class="button button__buy">Купить
          за ${data.value}₽</a>
      </div>
      <div class="right-side">
        <div class="block-left">
          <div class="city__from">Вылет из города</br>
            <span class="city__name">${getNameCity(data.origin)}</span>
          </div>
          <div class="date">${getDate(data.depart_date)}</div>
        </div>
    
        <div class="block-right">
          <div class="changes">${getChanges(data.number_of_changes)}</div>
          <div class="city__to">Город назначения:</br>
            <span class="city__name">${getNameCity(data.destination)}</span>
          </div>
        </div>
      </div>
    </div>
    `;
  } else {
    deep = '<h3>К сожалению, на текущую дату билетов нет</h3>'
  }


  ticket.insertAdjacentHTML('afterbegin', deep)
  return ticket;
};

const renderCheapDay = (cheapTicket) => {
  cheapestTicket.style.display = 'block';
  cheapestTicket.innerHTML = '<h2>Самый дешевый билет на выбранную дату</h2>';

  const ticket = createCard(cheapTicket[0]);
  cheapestTicket.append(ticket);
};

const renderCheapYear = (cheapTickets) => {
  otherCheapTickets.style.display = 'block';
  otherCheapTickets.innerHTML = '<h2>Самые дешевые билеты на другие даты</h2>';

  cheapTickets.sort((a, b) => a.value - b.value);

  for (let i = 0; i < cheapTickets.length && i < MAX_COUNT; i++) {
    const ticket = createCard(cheapTickets[i]);
    otherCheapTickets.append(ticket);
    // return ticket;
  }
  console.log(cheapTickets);

};

const renderCheap = (data, date) => {
    const cheapTicketYear = JSON.parse(data).best_prices;
    
    const cheapTicketDay = cheapTicketYear.filter((item) => {
      return item.depart_date === date;
    });

    renderCheapYear(cheapTicketYear);
    renderCheapDay(cheapTicketDay);

};


//eventListeners


inputCitiesFrom.addEventListener('input', () => {
  showCity(inputCitiesFrom, dropDownCitiesFrom)
});

dropDownCitiesFrom.addEventListener('click', () => {
  selectCity(event, inputCitiesFrom, dropDownCitiesFrom)
});

inputCitiesTo.addEventListener('input', () => {
  showCity(inputCitiesTo, dropDownCitiesTo);
});

dropDownCitiesTo.addEventListener('click', () => {
  selectCity(event, inputCitiesTo, dropDownCitiesTo)
});


formSearch.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = {
      from: city.find((item) => inputCitiesFrom.value === item.name),
      to: city.find((item) => inputCitiesTo.value === item.name),
      when: inputDateDepart.value,
    }

    if (formData.from && formData.to) {
      const requestData = `?depart_date=${formData.when}&origin=${formData.from.code}` + 
      `&destination=${formData.to.code}&one_way=true&token=` + API_KEY;
      
      getData(calendar + requestData, (response) => {
        renderCheap(response, formData.when);
      }, error => {
        cheapestTicket.style.display = 'block';
        cheapestTicket.innerHTML = '<h2>Билетов по данному направлению нет</h2>';
        console.error('Ошибка', error)        
      });
    } else {
      cheapestTicket.style.display = 'block';
      cheapestTicket.innerHTML = '<h2>Введите корректное название города</h2>';
    }
});

//function call

getData(citiesApi, data =>{   
  city = JSON.parse(data);

  city.sort((a, b) => {
    if (a.name > b.name) return 1;
    if (a.name < b.name) return -1;
    else return 0;
  });
});

// getData(calendar + '?depart_date=2021-01-04&origin=SVX&destination=KGD&one_way=true&token=' + API_KEY, data =>{
   
//   const cheapTicket = JSON.parse(data).best_prices.filter(item => item.depart_date === '2021-01-04')

//   console.log(cheapTicket);

// });