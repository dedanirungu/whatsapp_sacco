import Home from '../views/Home.vue'
import Members from '../views/Members.vue'
import MemberDetails from '../views/MemberDetails.vue'
import Contributions from '../views/Contributions.vue'
import Loans from '../views/Loans.vue'
import LoanDetails from '../views/LoanDetails.vue'
import Messages from '../views/Messages.vue'
import NotFound from '../views/NotFound.vue'

// Routes configuration
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/members',
    name: 'Members',
    component: Members
  },
  {
    path: '/members/:id',
    name: 'MemberDetails',
    component: MemberDetails
  },
  {
    path: '/contributions',
    name: 'Contributions',
    component: Contributions
  },
  {
    path: '/loans',
    name: 'Loans',
    component: Loans
  },
  {
    path: '/loans/:id',
    name: 'LoanDetails',
    component: LoanDetails
  },
  {
    path: '/messages',
    name: 'Messages',
    component: Messages
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

export default routes