import * as html from './html'
import * as image from './image'
import * as video from './video'
import * as link from './link'

import { Rule } from '../interfaces'

/**
 * List of rules, executes against first match.
 */
const rules: Rule[] = [
  html,
  image,
  video,
  link
]

export default rules