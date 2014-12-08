# SQLViz
==============

### About

[SQLViz][site] is a web application which visually represents SQL queries in real time. It was built to help users learn SQL or help those who already know SQL to easily visualize complex queries and their results. SQLViz was developed as a final project for the Database Systems course at Duke University.

### Directory Structure
Within the SQL-Visualizer/src directory, these are the core components of the application.
- /client/app/main
 - This directory contains the main view and view controller for the application
- /client/app/treeGraph
 - This directory contains the components necessary to create the visualization from the Abstract Syntax Tree
- /server/api/sql
 - This directory contains the code associated with the /api/sql route used to feed the client all of the data it needs to build the visualizations after processing the AST.

### Setting Up

Before running SQLViz locally make sure that you've installed [Node.js][node] and [Bower][bower].

The first step is cloning the project:
```sh
git clone https://github.com/Tadimsky/SQL-Visualizer.git
```

Next, go to the SQL-Visualizer/src directory and install the dependencies:

```sh
bower install
npm install
```

Finally run the server:

```sh
grunt serve
```

If you get a message that the process could not be started due to Chrome being missing, force the grunt server to start anyways and point your browser to 'localhost:9000'.

### Limitations

Unfortunately SQL visualization is extremely difficult, as a result some features of this application are not yet functional. One of the primary pieces of functionality that we would have liked to set up but could not is the drawing of lines between the tables. Another feature that we would have liked to implement is support for aggregate functions.

### Contributing

We welcome any contributions to SQLViz! If you find a bug please file submit an issue ticket and we'll get to it as soon as we can. We'd especially like help on any of the limited features listed above in our backlog. If you'd like to contribute please fork the repository and file a pull request with any feature you're interested in adding.

[site]:http://sqlviz.herokuapp.com
[node]:http://nodejs.org/
[bower]:http://bower.io/