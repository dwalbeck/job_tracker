# Job Tracker Install and Setup for Windows

## Prerequisites

This program was made to be easy to stand-up and get running, however in order to do that, it does require that 
Docker and/or Docker Compose is installed on your system.  Docker will run the services needed in Docker containers, 
which should have everything it needs to run installed in image used.  So let's install Docker first.


Docker is installed a bit different on Windows.  It uses [Docker Desktop](https://www.docker.com/products/docker-desktop/), 
which you can click on the link to download the right version for your hardware.  Docker Compose is packaged along with 
Docker Desktop, so this should be all that is needed. As I understand it, the install requires WSL, which is covered in 
the [official instructions](https://docs.docker.com/desktop/setup/install/windows-install/). They did an excellent job explaining all things Docker Desktop, so I'm not going to 
repeat it here.

Networking works a bit differently in Windows, and you will need to make some configuration selections in Docker Desktop. 



