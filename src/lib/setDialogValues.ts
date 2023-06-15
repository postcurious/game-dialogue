import { variables } from '../assets/dialogue.yaml'
import type { BotConditionalResponse, BotMessage, BotResponse } from '../types'

type Variables = Record<string, string[]>

const entries = Object.entries(variables as Variables)

/**
 * Replaces $ prefixed variables in the dialog.json file
 * @param {*} obj Object to replace variables within
 */
 export const setDialogValues = (obj: BotMessage | BotResponse | BotConditionalResponse) => {

  if (window.debugChatMessages) {
    console.log("attempting to set dialog values", obj)
    try {
      console.log("attempting to stringify", JSON.stringify(obj))
  
      console.log("attempting to stringify", JSON.parse(JSON.stringify(obj)))
    } catch (e) {
      console.log("ERROR ", e)
    }
  }


  return JSON.parse(JSON.stringify(obj), (_key, value) => {
    if (!Array.isArray(value)) return value

    let result = [...value]

    for (const [varkey, varval] of entries) {
      const i = result.indexOf(varkey)

      if (i !== -1) {
        result.splice(i, 1)
        result = [...result, ...varval]
      }
    }

    return result
  })
}
