

var Person = function(firstname){
    this.firstname = firstname;
    this.sayHello = function(){
        console.log('hello Im '+this.firstname)
    }
}

var p = new Person('al');
p.sayHello();

function Student(firstname, subject){
    Person.call(this, firstname);
    this.subject = subject;
};
Student.prototype.sayHello = function(){
  console.log("Hello, I'm " + this.firstName + ". I'm studying " + this.subject + ".");
};

Student.prototype = Object.create(Person.prototype);
Student.prototype.constructor = Student;

var student1 = new Student("Janet", "Applied Physics");
console.log(student1.firstname, student1.subject);

student1.sayHello();
