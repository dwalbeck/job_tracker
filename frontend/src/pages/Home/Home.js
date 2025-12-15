import React, {useEffect} from 'react';
import logger from '../../utils/logger';

const Home = () => {
    useEffect(() => {
        logger.logPageView('Home', '/');
    }, []);

    return (
        <div className="page">
            <h1>Home</h1>
            <p>Welcome to the Job Tracker application.</p>
        </div>
    );
};

export default Home;