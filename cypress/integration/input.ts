/// <reference types="cypress" />

describe('chat app variable inputs', () => {
  beforeEach(() => {
    cy.viewport('iphone-se2')
    cy.visit('localhost:3000')
    cy.window().then(() => sessionStorage.setItem('env', 'cypress'))
  })

  const inputs = [
    [' JaN', '  mikey '],
    [' march ', 'mïkēy '],
  ]

  for (const [month, name] of inputs) {
    it(`can parse ${month} + ${name}`, () => {
      cy.text(/please enter the month of our most recent correspondence/i)
      cy.input(month)
    
      cy.text(/enter your first name to continue./i)
      cy.input(name)
    
      cy.text(/connecting/i)
      cy.text(new RegExp(`hi ${name}`, 'i'))
    })
  }
})
