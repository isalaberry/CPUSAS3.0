# Simulador de Algoritmos de Escalonamento da CPU

Este projeto é uma ferramenta web que simula o funcionamento de algoritmos de escalonamento da CPU. Seu objetivo principal é oferecer uma representação gráfica do comportamento de diferentes algoritmos de escalonamento, como FIFO, SJF, RR, Prioridades e mais. O simulador tem como público-alvo estudantes de Sistemas Operativos e busca facilitar o aprendizado dos conceitos de escalonamento de processos de maneira interativa e visual.

## Tecnologias Utilizadas

- **ReactJS**: Framework JavaScript para construção da interface de usuário.
- **Firebase**: Utilizado para banco de dados, autenticação e hospedagem:
  - **[Firebase Authentication](https://firebase.google.com/docs/auth)**: Para gerenciar a autenticação de usuários.
  - **[Firebase Firestore (NoSQL)](https://firebase.google.com/docs/firestore)**: Para armazenar dados relacionados aos processos simulados.
  - **[Firebase Hosting](https://firebase.google.com/docs/hosting)**: Para hospedar a aplicação web.

## Funcionalidades

- **Simulação de algoritmos de escalonamento**: Suporta FIFO, SJF, RR, Prioridades, e suas combinações.
- **Personalização de parâmetros**: Permite configurar o número de processos, o tempo total de CPU necessário, o tempo de entrada na fila de ready, entre outros.
- **Geração de cenários aleatórios**: O simulador pode gerar cenários automaticamente com base em parâmetros definidos.
- **Visualização passo-a-passo**: Permite acompanhar o processo de escalonamento passo a passo, facilitando a compreensão dos algoritmos.

## Como Usar

### Passo 1: Instalar o Node.js

Para rodar o projeto, você precisa ter o **Node.js** instalado. Você pode fazer o download e a instalação conforme seu sistema operacional através do site oficial:

- **[Download Node.js](https://nodejs.org/)**

### Passo 2: Clonar o Repositório

- Clone o repositório do projeto para a sua máquina local:
```bash
git clone https://github.com/isabelsalaberry/CPUSAS.git
```
Instale as dependências
```bash
npm install
```
- Execute o projeto localmente
```bash
npm run dev
```
## Hospedagem

O projeto está hospedado no Firebase Hosting e pode ser acessado através do seguinte link:

[https://cpusas.web.app](https://cpusas.web.app)


---


# CPU Scheduling Algorithm Simulator

This project is a web tool that simulates the operation of CPU scheduling algorithms. Its main objective is to provide a graphical representation of the behaviour of different scheduling algorithms, such as FIFO, SJF, RR, Priorities and more. The simulator is aimed at students of Operating Systems and seeks to facilitate the learning of process scheduling concepts in an interactive and visual way.

## Technologies Used

- **ReactJS**: JavaScript framework for building the user interface.
- **Firebase**: Used for database, authentication and hosting:
  - **[Firebase Authentication](https://firebase.google.com/docs/auth)**: To manage user authentication.
  - **[Firebase Firestore (NoSQL)](https://firebase.google.com/docs/firestore)**: To store data related to simulated processes.
  - **[Firebase Hosting](https://firebase.google.com/docs/hosting)**: To host the web application.

## Features

- Simulation of scheduling algorithms**: Supports FIFO, SJF, RR, Priorities, and their combinations.
- **Parameter customisation**: Allows you to configure the number of processes, the total CPU time required, the ready queue entry time, among others.
- Random scenario generation**: The simulator can generate scenarios automatically based on defined parameters.
- Step-by-step visualisation**: Allows you to follow the scheduling process step by step, making it easier to understand the algorithms.

## How to use

### Step 1: Install Node.js

To run the project, you need to have **Node.js** installed. You can download and install it according to your operating system from the official website:

- **[Download Node.js](https://nodejs.org/)**

### Step 2: Clone the Repository

- Clone the project repository to your local machine:
```bash
git clone https://github.com/isabelsalaberry/CPUSAS.git
```
- Install the dependencies
```bash
npm install
```
- Run the project locally
```bash
npm run dev
```
## Hosting

The project is hosted on Firebase Hosting and can be accessed via the following link:

[https://cpusas.web.app](https://cpusas.web.app)
