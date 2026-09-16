# Access model

Public visitors can browse the catalogue and branch-specific collection boards. Customers must sign in to create orders and can read only their own orders, profile, cart and rewards. The local demo supplies password accounts; hosted auth must be configured separately.

Staff and store managers are bound to a branch. Their order queue and status changes are restricted by database policies. The global administrator manages all branches and protected team accounts. Customers cannot set totals or mark payments paid through table writes. Simulated payment uses the validated backend operation.

The board is intentionally public and shows collection numbers and preparation status only. It never lists customer names, emails or full order details. A board URL selects one branch; knowing another branch URL does not grant staff access.

Local passwords are random, salted and hashed in the isolated database. The generated accounts file is private local demo output, ignored by git and excluded from starter export. No production credentials or real customer data are included.
