import React from 'react';
import { Link } from 'react-router-dom';

class HomePage extends React.Component {
    
    render(){
      return (
        <div>
            <h1 className="page-title"> Welcome! </h1>
        


            <p className="text-justify lead">
                <Link to="/todos">Todos</Link>
            </p>
            
        </div>
    )}
}

export default HomePage;