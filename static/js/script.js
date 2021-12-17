const BASE_URL = 'https://nginx.carny.io';
const END_POINT ='save-email';
const emailInput = document.getElementById('email-input');
const emailForm = document.getElementById('email-form');


emailForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if(emailInput.value !== '') {
      axios.post(`${BASE_URL}/${END_POINT}?email=${emailInput.value}`)
      .then(res => {
        alert(res.data.message, "Subscribe");
      })
      .catch(err => {
        alert("Server Error!!", "Subscribe");
      })
      .finally(() => {
        emailInput.value = "";
      })
    } else {
      alert("Please, Write your e-mail adress..., ", "Subscribe");
    }
}, true)