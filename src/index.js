import './chat.js'

/**
 * @TODO move inputs onto a stack, sleeping could cause bot to miss them
 */
const main = async () => {
  const inputs = {}

  let modifiedText = ''
  let inputPromiseResolve
  let textItems = []

  const response = await window.fetch('./dialogue.json')
  const config = await response.json()

  const {
    defaultSleepFor,
    defaultSleepBefore,
    variables
  } = config

  const { parse, stringify } = JSON

  const getTextItems = () => {
    return parse(stringify(config.textItems))
  }

  const fillVariables = () => {
    config.textItems = parse(stringify(config.textItems, (_, value) => {
      if (!Array.isArray(value)) return value

      for (const [varKey, varVal] of Object.entries(variables)) {
        if (value.includes(varKey)) {
          value.splice(value.indexOf(varKey), 1)
          value = [...value, ...varVal]
        }
      }

      return value
    }))
  }

  const startInputLoop = async () => {
    for (const item of textItems) {
      const shouldRestart = await textItem(item)

      if (shouldRestart) {
        startInputLoop()
        break
      }
    }
  }

  /**
   * Promisify setTimeout. Sleeps for n seconds.
   * @param {number} seconds
   * @returns {Promise}
   */
  const sleep = (seconds) => {
    return new Promise((resolve) => {
      setTimeout(resolve, seconds * 1000)
    })
  }

  /**
   * Sets up a new promise that will resolve
   * when user input is submitted
   * @returns {Promise}
   */
  const listenForInput = () => {
    return new Promise((resolve) => {
      inputPromiseResolve = resolve
    })
  }

  /**
   * Handles a single text item within the dialogue
   * @param {Object} item
   */
  const textItem = async (item) => {
    const {
      text,
      sleepFor = defaultSleepFor,
      sleepBefore = defaultSleepBefore,
      saveInputAs,
      waitFor = [],
      waitForAnyInput = false,
      defaultResponses = config.defaultResponses,
      goto
    } = item

    if (text) {
      chat.startMessage({ origin: 'remote' })
    }

    if (sleepBefore) {
      await sleep(sleepBefore)
    }

    modifiedText = text

    if (modifiedText) {
      for (const [key, value] of Object.entries(inputs)) {
        modifiedText = modifiedText.replace(`{${key}}`, value)
      }

      chat.commitMessage({ text: modifiedText })
    }

    if (saveInputAs) {
      inputs[saveInputAs] = await listenForInput()
    }

    while (waitFor.length > 0) {
      const input = await listenForInput()

      let match

      for (const child of waitFor) {
        for (const str of child.acceptedInputs) {
          if (input.toLowerCase().includes(str.toLowerCase())) {
            match = child
            waitFor.splice(waitFor.indexOf(child), 1)

            if (child.saveInputAs) {
              inputs[child.saveInputAs] = input.toLowerCase()
            }

            break
          }
        }
      }

      if (match && match.text) {
        await textItem(match)
      } else if (!match) {
        const rand = Math.random() * defaultResponses.length | 0
        await textItem(defaultResponses[rand])
      }
    }

    if (waitForAnyInput) {
      await listenForInput()
    }

    await sleep(sleepFor)

    if (goto) {
      const key = goto.slice(1)
      const index = textItems.find((item) => {
        const acceptedVals = item[key]
        const inputval = inputs[key]
        return acceptedVals && acceptedVals.includes(inputval)
      })

      textItems = getTextItems().splice(index)

      return true
    }

    return false
  }

  document.head.querySelector('title').textContent = 'Koschei Society'

  const chat = document.createElement('chat-widget')
  document.body.appendChild(chat)

  chat.onUserInput((text) => {
    if (inputPromiseResolve) {
      inputPromiseResolve(text)
    }
  })

  fillVariables()

  textItems = getTextItems()
  startInputLoop()
}

main()
