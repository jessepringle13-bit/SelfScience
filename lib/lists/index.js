// /app/lib/lists/index.js
// Thin wrappers over makeListStore for each namespaced list.
import { makeListStore } from './store'

export const medicationsStore = makeListStore('ss_my_medications')
export const stackStore       = makeListStore('ss_my_stack')
export const groceryStore     = makeListStore('ss_grocery_list')
