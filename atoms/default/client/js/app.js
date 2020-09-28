// if you want to import a module from shared/js then you can
// just do e.g. import Scatter from "shared/js/scatter.js"
import { doggies } from "shared/js/dogs";


Promise.all([
	fetch('<%= path %>/dogs.json').then(res => res.json()),
	fetch('https://interactive.guim.co.uk/docsdata/1IxqYMvBZfUrjiQns4XqpLLi85oemwF4IF-L0it9rTbk.json').then(res => res.json())
])
.then((results) =>  {

	doggies(results[0],results[1])

});