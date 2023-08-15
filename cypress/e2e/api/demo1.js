describe('DemoQa Test Scripts', function () {
    const randomNumber = Math.floor(Math.random() * 10000);
    let newUserName = `eddy${randomNumber}`
    let token;
    let userID;
    let user = {
        "userName": `${newUserName}`,
        "password": "Pass954!"
    }
    let anyIsbn;

    beforeEach('Before All Tests', function () {
        cy.fixture('authors').then(function (authors) {
            this.authors = authors;
        })
    });

    it('Create a User', function () {
        cy.request({
            method: 'POST', url: `${Cypress.env('baseURL')}/Account/v1/User`, body: user,
            /*body: {
                "userName": `${newUserName}`,
                "password": "Pass954!"
            },*/
            contentType: 'application/json'
        }).then(function (response) {
            expect(response.status).to.eq(201);
            const responseBody = response.body;
            cy.log("userId : " + responseBody.userID);
            userID = response.body.userID;
            cy.log("username : " + response.body.username);
        })
    });

    it('Generate Authentication Token', () => {
        cy.request({
            method: 'POST',
            url: `${Cypress.env('baseURL')}/Account/v1/GenerateToken`,
            body: user,
            contentType: 'application/json'
        }).then(function (response) {
            expect(response.status).to.eq(200);
            token = response.body.token;
            cy.log("token : " + response.body.token);
        })
    });

    it('Get List of Books', () => {
        cy.request('GET', `${Cypress.env('baseURL')}/BookStore/v1/Books`)
            .then(function (response) {
                expect(response.status).to.eq(200);
                cy.log(response.body.books[0].title);
                const books = response.body.books;
                anyIsbn = books[0].isbn;
                cy.log(anyIsbn);
                for (let book of books) {
                    expect(book.title).not.to.be.empty;
                    expect(book.isbn).not.to.be.empty;
                }
            })

    });

    it('Filter by Publisher or Author', function () {
        for (let author of this.authors) {
            cy.log(author.name)
            let filteredBooks = [];
            cy.request('GET', `${Cypress.env('baseURL')}/BookStore/v1/Books`)
                .then(function (response) {
                    for (let i = 0; i < 8; i++) {
                        if (response.body.books[i].author == author.name) {
                            filteredBooks.push(response.body.books[i].title);
                        }
                    }
                    cy.log(author.name + ' books are : ' + filteredBooks);
                });
        }

    });

    it('Post Books to the User in Context', function () {
        cy.request({
            method: 'POST',
            url: `${Cypress.env('baseURL')}/BookStore/v1/Books`,
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: {
                "userId": `${userID}`,
                "collectionOfIsbns": [{
                    "isbn": `${anyIsbn}`
                }]
            }
        }).then(function (response) {
            expect(response.status).to.eq(201)
        })

        cy.request({
            method: 'GET',
            url:`${Cypress.env('baseURL')}/Account/v1/User/${userID}`,
            headers: {
                Authorization: `Bearer ${token}`
            },
            contentType:'application/json'
        }).then((response) =>{
            expect(response.status).to.eq(200);
            expect(response.body.books[0].isbn).to.eq(anyIsbn);
        })
    });
});