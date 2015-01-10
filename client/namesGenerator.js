var phrases = new Array("Going for a walk",
	"Adventure item",
	"Book club meeting",
	"Hackathon"
);

function getName(){
	return(phrases[Math.floor(Math.random()*phrases.length)]);
}
function getContent(){
	var cons = new Array("k","s","t","n","h","m","y","r","w");
	var vowel = new Array("a","i","u","e","o");
	
	var string = ""
	
	for(var i = 0; i < Math.random()*50; i++){ //number of words
		string += " ";
		for(var n=0; n<Math.random()*6; n++){ //number of sylables
			string += cons[Math.floor(Math.random()*cons.length)];
			string += vowel[Math.floor(Math.random()*vowel.length)];
		}
	}
	string += ".";
	return string;
}