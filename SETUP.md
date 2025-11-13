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


