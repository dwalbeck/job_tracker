# Job Tracker Install and Setup

## Prerequisites

This program was made to be easy to stand-up and get running, however in order to do that, it does require that 
Docker and/or Docker Compose is installed on your system.  Docker will run the services needed in Docker containers, 
which should have everything it needs to run installed in image used.  So let's install Docker first.

#### Windows 10/11

Docker is installed a bit different on Windows.  It uses [Docker Desktop](https://www.docker.com/products/docker-desktop/), 
which you can click on the link to download the right version for your hardware.  Docker Compose is packaged along with 
Docker Desktop, so this should be all that is needed. As I understand it, the install requires WSL, which is covered in 
the [official instructions](https://docs.docker.com/desktop/setup/install/windows-install/) 


#### Mac OS

For Macs, you also have the option of installing [Docker Desktop](https://www.docker.com/products/docker-desktop/), 
which will have both Docker and Docker Compose.  I believe you can also install Docker Compose using homebrew 
**brew install docker-compose**, but that's beyond my Mac abilities. Docker Compose can also be installed a from the 
command line [official instructions](https://docs.docker.com/desktop/setup/install/mac-install/)

#### Linux (Ubuntu)

First we'll install the main Docker engine
```bash
sudo apt update
sudo apt install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
apt-cache policy docker-ce
sudo apt install docker-ce
sudo systemctl status docker
sudo usermod -aG docker ${USER}
```
And now Docker Compose is installed as a plugin [full instructions](https://docs.docker.com/compose/install/linux/)
```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

#### NOTE:
If you install Docker Desktop, it runs a bit differently.  The normal install of Docker will automatically start on boot 
bind itself to unix:///var/run/docker.sock.  Docker Desktop on the other hand will use a TCP socket, which you can reference 
in the configuration settings within Docker Desktop.  Docker Desktop also requires you to start the application before you 
can use or run anything Docker.

#### OpenAI API Key

In order to be able to use features, such as resume rewriting and cover letter generation, you will need to sign-up for 
service aith OpenAI.  It does require that you add some credits to your account, but I believe new sign-ups also get a 
$5 credit given.  You can sign-up for an account at [OpenAI](https://openai.com/index/openai-api/).  Once you have an 
account, you will be able to create API keys to authenticate and identify your account. Pull up the [API Keys](https://platform.openai.com/api-keys) 
webpage and click the "+ Create new secret key" button.  It might require you to create a project first, if so then create 
a project first.  Pick any name you like for the project and key name.  You will then see the hashed key value, which 
make certain that you have copied this value, as you will not be able to view it ever again.



### Project Configuration / Build

So now your ready to get the code and build the Docker images. A Docker image is built using a base image that usually 
contains the desired OS, then performs some project specific configuration and installation of required software packages. 
The end result creates a new image, which is ran inside containers. Let's start by getting the codebase, which we'll do 
from the terminal console.
```bash
git clone git@github.com:dwalbeck/job_tracker.git
```
Retrieving it this way does require that you have **Git** installed or you can also just download the zip file by going 
directly to [Github](https://github.com/dwalbeck/job_tracker/tree/main) and click on the green button labeled "<> Code", 
which will have a "Download Zip" link at the bottom.  If you download the Zip file, you must extract the files.

Now that you have a copy of the codebase, you will need to create environment files for the frontend React application 
and the backend Python API server.  The code for both of these projects, as well as the Docker Compose script, expects 
and relies on these files being present and configured.  Things are unlikely to start if this file is missing.  So let's 
start with the frontend environment file first.  There should be an example environment file located in the **frontend** 
directory named **.env.example**, which you'll copy and name **.env** in the same directory.  You can also just copy 
these commands, executed from a terminal in the top level directory.

```bash
cd ./frontend
cp .env-example .env
cd ../backend
cp .env-example .env

```

This will give you a solid starting point and your welcome to leave and use the pre-populated values.  There are however 
a couple settings that you will need to provide in order for everything to work as designed. The most important variable to 
define is the OPENAI_API_KEY variable.  This will require you to get an account with OpenAI, which you can pay whatever 
amount you want and use it until it's depleted, which is quite a while. [Click here](https://platform.openai.com/docs/quickstart) 
to for instructions on where to get your OpenAI API Key and sign-up.

If you want to change the DB credentials or database name, you are certainly welcome to. Any change to the credentials, you 
will want to insure that you change the DATABASE_URL, POSTGRES_USER and POSTGRES_PASSWORD fields. Also note that during the 
initial DB setup, a SQL script is executed that includes GRANT permissions and also manually sets the password.  This can be 
found in the **docs/schema.sql** file on lines 218 - 224, which you'll also want to have match your choosen values.

Some values you won't want to change, and if you did change, could very likely break things from working.  For example, don't 
change the PGDATA path, as this is the standard expeced by PostgreSQL and is also configured to work with how the containers 
are configured.  I would also recommend keeping the file storage directory paths the same.  These are path that operate 
within the backend container, so there isn't really any advantage to changing them.  Also, the database host is very important 
to have set correctly and will depend entirely on the Docker setup used.  Networking is very different for Linux users, 
which Docker has great capabilities that allow for static IP assigning.  On Windows and MacOS however, these same capabilities 
are not possible, so things are setup differently using port mappings.  In a nutshell, if you using Linux, then the host 
should be set to **psql.jobtracknow.com** and for Windows and MacOS it would be simply **db**.

Linux users will want to additionally make an entry to your **/etc/hosts** file to override DNS.  This will allow you to use 
the fake domain naming used for the services.
```bash
echo "172.20.0.5      portal.jobtracknow.com
172.20.0.10     api.jobtracknow.com
172.20.0.15     psql.jobtracknow.com" >> /etc/hosts
```

#### Building the Containers

With the environment variables all configured, you are now ready to build and run the containers configured in the Docker stack. 
This is a very simple and straight forward process, but will require that you have Docker Desktop or docker-compose installed 
on your machine.  First, open a terminal and navigate to the document root of the project (top level directory).  Then execute 
the following:
```bash
# For Linux users use the following
docker compose up --build -d

# For Windows and MacOS users, do the following
docker compose -f docker-compose-win.yml up --build -d

# You can also build each service separately
docker compose build backend
docker compose build frontend
docker compose build db

docker compose -f docker-compose-win.yml build backend
docker compose -f docker-compose-win.yml build frontend
docker compose -f docker-compose-win.yml build db
```

If there is any problem that occurs while building the containers, Docker will fail and exit the process.  It will also output 
details on why it failed in the content printed to the console.  This can be the result of a lot of possible things and is 
beyond the scope of this document, but there is a troubleshooting section in the main README.md and Google is a great resource 
to fix failed builds.  The Docker stack to start all the services once it has built each of the containers.

### Accessing the Application

For Linux:
- **Frontend**: http://portal.jobtracknow.com
- **Backend API**: http://api.jobtracknow.com
- **API Documentation**: http://api.jobtracknow.com/docs
- **Database**: postgresql://apiuser:change_me@psql.jobtracknow.com:5432/jobtracker

or for Windows and MacOS use:
- **Frontend**: http://localhost (preferred) or http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: postgresql://apiuser:change_me@localhost:5432/jobtracker
