import { Request, Response } from "express";
import { WaitlistEntryModel } from "../models/waitlistEntryModel"
import { MenuItemModel } from "../models/MenuItemModel"
import { RestaurantModel } from "../models/RestaurantModel";
import { CustomerModel } from "../models/CustomerModel";
import { MenuItemCategoryModel } from "../models/MenuItemCategoryModel";
import { OrderModel } from "../models/OrderModel";

import * as express from 'express';

var passport = require('passport');


export class Routes {

    public waitlist: WaitlistEntryModel;
    public order: OrderModel;
    public restaurantlist: RestaurantModel;
    public menuitem: MenuItemModel;
    public menuitemcat: MenuItemCategoryModel;
    public customerlist: CustomerModel;
    public idGenerator: number;

    constructor() {
        this.waitlist = new WaitlistEntryModel();
        this.order = new OrderModel();
        //this.menuItem = new MenuItemModel();
        this.idGenerator = 100;
        this.customerlist = new CustomerModel();
        this.restaurantlist = new RestaurantModel();
        this.menuitem = new MenuItemModel();
        this.menuitemcat = new MenuItemCategoryModel();
    }

    public routes(app): void {

        app.use('/', express.static(__dirname + '/angularDist'));

        app.get('/auth/google',
            passport.authenticate('google',

                { scope: ['https://www.googleapis.com/auth/plus.login', 'email'] }
            )
        );

        app.get('/auth/google/callback',
            passport.authenticate('google',
                {
                    successRedirect: '/#/home', failureRedirect: '/'
                }
            )
        );

        app.get('/logout', function (req, res) {
            console.log("Inside log out route");
            req.logout();
            delete req.user;
            req.session.destroy(function (err) {
                console.log("Inside session destroy");
                res.clearCookie('connect.sid');
                res.redirect('/#/login');
            });
        });

        app.get('/user/details', this.validateAuth, function (req, res) {
            res.json(req.user);
        })

        //get all  menuItems 
        app.route('/menuitems/:restId').get(this.validateAuth,(req: Request, res: Response) => {
            var restId = req.params.restId;
            console.log("Get all menuItems for rest id :" + restId);
            this.menuitem.retrieveAllMenuBasedOnRestaurant(res, { restaurantID: restId });
        })

        //get all  menuItems  by category
        app.route('/menuitems/:restId/:categoryId').get(this.validateAuth,(req: Request, res: Response) => {
            var restId = req.params.restId;
            var categoryId = req.params.categoryId;
            console.log("Get all menuItems for rest id : " + restId + "category : " + categoryId);
            this.menuitem.retrieveAllMenuBasedOnRestaurant(res, { restaurantID: restId, "itemCategory.categoryId": categoryId });
        })
        //add to menuItem of a particular restaurant
        app.route('/menuitems').post(this.validateAuth,(req: Request, res: Response) => {
            var menuitems_entry = {
                "itemID": req.body.itemID,
                "itemName": req.body.itemName,
                "price": req.body.price,
                "description": req.body.description,
                "restaurantID": req.body.restaurantID,
                "itemCategory":
                {
                    "categoryId": req.body.categoryId,
                    "categoryName": req.body.categoryName,
                    "description": req.body.description
                }
            }
            this.menuitem.addToMenuItem(res, menuitems_entry);
        })

        //add to menuItem category 
        app.route('/menuitemcategory').post(this.validateAuth,(req: Request, res: Response) => {
            var menuitems_entry = {
                "categoryId": req.body.categoryId,
                "categoryName": req.body.categoryName,
                "description": req.body.description
            }
            this.menuitemcat.addToMenuItemCategory(res, menuitems_entry);
        })

        //delete  menuItem of a particular restaurant
        app.route('/menuitems/:restId/:itemID').delete(this.validateAuth,(req: Request, res: Response) => {
            var restId = req.params.restId;
            var itemID = req.params.itemID;
            this.menuitem.deleteMenuBaseOnRestaurantAndMenuId(res, { "restaurantID": restId, "itemID": itemID });
        })

        //update menu item
        app.route('/menuitems').patch(this.validateAuth,(req: Request, res: Response) => {

            var menuitems_entry = {
                "itemID": req.body.itemID,
                "itemName": req.body.itemName,
                "price": req.body.price,
                "description": req.body.description,
                "restaurantID": req.body.restaurantID,
                "itemCategory.categoryId"
                    : req.body.categoryId,
                "itemCategory.categoryName": req.body.categoryName,
                "itemCategory.description": req.body.description
            }


            var restaurantId = req.body.restaurantID;
            var itemID = req.body.itemID;


            const searchCriteria = {

                "restaurantID": restaurantId,
                "itemID": itemID
            }

            const toBeChanged = {
                "$set": {
                    "itemID": req.body.itemID,
                    "itemName": req.body.itemName,
                    "price": req.body.price,
                    "description": req.body.description,
                    "restaurantID": req.body.restaurantID,
                    "itemCategory.categoryId"
                        : req.body.itemCategory.categoryId,
                    "itemCategory.categoryName": req.body.itemCategory.categoryName,
                    "itemCategory.description": req.body.itemCategory.description
                }
            }

            this.menuitem.updateMenuBaseOnRestaurantAndMenuId(res, searchCriteria, toBeChanged);
        })


        // ------------------------------- WAIT LIST START ---------------------------- //    
        // to get all the waitlist entries

        app.route('/waitlist/').get(this.validateAuth, (req: Request, res: Response) => {
            console.log('Query all wait lists');
            this.waitlist.retrieveAllWaitlists(res);
        })

        app.route('/waitlistTest/:restId').get((req: Request, res: Response) => {
            console.log(res.locals.auth);
            var restuarantId = req.params.restId;
            console.log("Query all waitlist items from restaurant with id: " + restuarantId);
            this.waitlist.retrieveAllWaitlistEntriesPerRestaurant(res, restuarantId);
        })

        // to get all the waitlist entries in a restaurant
        app.route('/waitlist/:restId').get(this.validateAuth,(req: Request, res: Response) => {
            console.log(res.locals.auth);
            var restuarantId = req.params.restId;
            console.log("Query all waitlist items from restaurant with id: " + restuarantId);
            this.waitlist.retrieveAllWaitlistEntriesPerRestaurant(res, restuarantId);
        })

        // set customer as notifed in waitlist
        app.route('/waitlist/:restaurantID/notify/:queueID').get(this.validateAuth, (req: Request, res: Response) => {
            var restaurantId = req.params.restaurantID;
            var queueID = req.params.queueID;
            console.log("Set customer as notified for " + queueID + " in " + restaurantId);
            this.waitlist.notifyRes(res, { restaurantID: restaurantId, queueID: queueID });
        })

        // set customer as confirmed in waitlist
        app.route('/waitlist/:restaurantID/confirm/:queueID').get(this.validateAuth,(req: Request, res: Response) => {
            var restaurantId = req.params.restaurantID;
            var queueID = req.params.queueID;
            console.log("Set customer as confirmed for " + queueID + " in " + restaurantId);
            this.waitlist.confirmRes(res, { restaurantID: restaurantId, queueID: queueID });
        })

        // remove reservation in waitlist
        app.route('/waitlist/:restaurantID/:queueID').delete(this.validateAuth, (req: Request, res: Response) => {
            var restaurantId = req.params.restaurantID;
            var queueID = req.params.queueID;
            console.log("Removing reservation: " + queueID + " in " + restaurantId);
            this.waitlist.deleteRes(res, { restaurantID: restaurantId, queueID: queueID });
        })

        // complete a reservation in waitlist
        app.route('/waitlist/:restaurantID/complete/:queueID').post(this.validateAuth, (req: Request, res: Response) => {
            var restaurantId = req.params.restaurantID;
            var queueID = req.params.queueID;
            this.restaurantlist.updateBooktime({restaurantID: restaurantId});
            console.log("Complete a reservation: " + queueID + " in " + restaurantId);
            this.waitlist.completeRes(res, { restaurantID: restaurantId, queueID: queueID });
        })


        // update group size for reservation in waitlist
        app.route('/waitlist/:restaurantID/:queueID').patch(this.validateAuth, (req: Request, res: Response) => {
            var restaurantId = req.params.restaurantID;
            var queueID = req.params.queueID;
            var groupSize = req.body.groupSize;

            const searchCriteria = {
                "restaurantID": restaurantId,
                "queueID": queueID
            }

            const toBeChanged = {
                "$set": {
                    "groupSize": groupSize
                }
            }
            console.log("Updating group size for reservation: " + queueID + " in " + restaurantId);
            this.waitlist.updateGroupSize(res, searchCriteria, toBeChanged);
        })

        app.route('/waitlistTest').post((req: Request, res: Response) => {
            console.log(req.body);
            var jsonObj = req.body;
            this.waitlist.model.create([jsonObj], (err) => {
                if (err) {
                    console.log('object creation failed');
                }
            });
            res.send("You are added to the waitlist.");
        })

        // ------------------------------- WAIT LIST END ---------------------------- // 

        //get all customers
        app.route('/customers').get((req: Request, res: Response) => {
            console.log("Get all customers" + res);
            this.customerlist.getAllCustomers(res);
        })

        // get all customer with given ID
        app.route('/customers/:customerId').get(this.validateAuth,(req: Request, res: Response) => {
            var customerId = req.params.customerId;
            console.log("Get all customer using ID: " + customerId);
            this.customerlist.getAllCustomersOnFilter(res, { "customerId": customerId });
        })

        // get all customers with given last name
        app.route('/customers/lastName/:lastName').get(this.validateAuth,(req: Request, res: Response) => {
            var lastName = req.params.lastName;
            console.log("Get all customer(s) with last name: " + lastName);
            this.customerlist.getAllCustomersOnFilter(res, { "lastName": lastName });
        })

        // get all customers with given first name
        app.route('/customers/firstName/:firstName').get(this.validateAuth,(req: Request, res: Response) => {
            var firstName = req.params.firstName;
            console.log("Get all customer(s) with first name: " + firstName);
            this.customerlist.getAllCustomersOnFilter(res, { "firstName": firstName });
        })

        // add to customer to DB
        app.route('/customers').post(this.validateAuth,(req: Request, res: Response) => {
            console.log(req.body);
            var jsonObj = req.body;
            jsonObj.customerId = this.idGenerator;
            res.send("Customer Added! customerID is " + this.idGenerator.toString());
            this.customerlist.addToCustomer(res, jsonObj);
            this.idGenerator++;
        })


        //get all  restaurants 
        app.route('/restaurantlist').get(this.validateAuth,(req: Request, res: Response) => {
            console.log("Get all restaurants" + res);
            this.restaurantlist.retrieveAllRestaurantsLists(res);
        })
        // to get restaurant by city or name
        app.route('/restaurantlist/:param').get(this.validateAuth,(req: Request, res: Response) => {
            var param = req.params.param;
            console.log("Get all restaurants  with city: " + param);
            var regex_param = new RegExp(["^", param, "$"].join(""), "i");
            this.restaurantlist.retrieveAllRestaurantsListBasedOnCityOrName(res, { $or: [{ "address.city": regex_param }, { "name": regex_param }] });
        })

        // to restaurant by id
        app.route('/restaurantlist/id/:id').get(this.validateAuth,(req: Request, res: Response) => {
            var id = req.params.id;
            console.log("Get all restaurants  with id: " + id);
            this.restaurantlist.retrieveAllRestaurantsListBasedOnId(res, { "restaurantID": id });
        })

        app.route('/restaurantlist').post(this.validateAuth,(req: Request, res: Response) => {
            console.log(req.body);
            var jsonObj = req.body;
            this.restaurantlist.model.create([jsonObj], (err) => {
                if (err) {
                    console.log('object creation failed');
                }
            });
            res.send("Restaurant Added.");
        })

        //add to waitlist of a particular restaurant
        app.route('/waitlist').post(this.validateAuth,(req: Request, res: Response) => {
            console.log(req.body);
            var jsonObj = req.body;
            this.waitlist.model.create([jsonObj], (err) => {
                if (err) {
                    console.log('object creation failed');
                }
            });
            res.send("You are added to the waitlist.");
        })

        // retrive order cart for a customer in a restaurant's cart
        app.route('/orders/:restaurantId/:customerId').get(this.validateAuth,(req: Request, res: Response) => {
            var customerId = req.params.customerId;
            var restaurantId = req.params.restaurantId;

            this.order.retrieveOrderPerCustomer(res, { restaurantID: restaurantId, customerId: customerId });

        })

        // retrive order cart for a customer in a restaurant's cart
        app.route('/orders/:restaurantId/:customerId').get(this.validateAuth,(req: Request, res: Response) => {
            var customerId = req.params.customerId;
            var restaurantId = req.params.restaurantId;

            this.order.retrieveOrderPerCustomer(res, { restaurantID: restaurantId, customerId: customerId });
        })

        app.route('/order/:orderId').get(this.validateAuth,(req: Request, res: Response) => {
            var orderId = req.params.orderId;
            this.order.retrieveOrderPerCustomer(res, { orderId: orderId });
        })

        // add to orderCart
        app.route('/orders').post(this.validateAuth,(req: Request, res: Response) => {
            console.log("Restaurant id:" + req.body.restaurantID);
            var jsonObj = {
                "orderId": req.body.orderId,
                "menuItemId": req.body.menuitemId,
                "quantity": req.body.quantity,
                "orderTime": req.body.orderTime,
                "customerId": req.body.customerId,
                "restaurantID": req.body.restaurantID
            }
            this.order.addToCart(res, [jsonObj]);
        })

        // edit the quantity of an order in the cart
        app.route('/orders').patch(this.validateAuth,(req: Request, res: Response) => {
            var customerId = req.body.customerId;
            var restaurantId = req.body.restaurantID;
            var menuitemID = req.body.menuitemID;
            var quantity = req.body.quantity;

            const searchCriteria = {
                "customerId": customerId,
                "restaurantID": restaurantId,
                "menuitemID": menuitemID
            }

            const toBeChanged = {
                "$set": {
                    "quantity": quantity
                }
            }

            this.order.updateQuantity(res, searchCriteria, toBeChanged);
        })
    }

    private validateAuth(req, res, next): void {
        if (req.isAuthenticated()) { console.log("user is authenticated"); return next(); }
        console.log("user is not authenticated");
        res.redirect('/');
    }
}
