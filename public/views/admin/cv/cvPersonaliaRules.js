/**
 * Created by erik on 4/9/18.
 */
function addCVPeronaliaForm(cv) {
    if(!cv){

        var formPersonalia =
                    '<div class="tab-pane active fade in" id="tab1"> ' +
                        '<div class="row margin-bottom-10" id="frmPersonalia"> ' +
                            '<div class="col-md-6"> ' +
                                '<div class="row"> ' +
                                    '<div class="form-group col-md-6"> ' +
                                        '<label for="Voornaam">Voornaam</label> ' +
                                        '<input type="text" class="form-control" name="txtVoornaam" id="txtVoornaam" placeholder="Voornaam"> ' +
                                '</div> ' +
                                '<div class="form-group col-md-6"> ' +
                                    '<label for="Achternaam">Achternaam</label> ' +
                                    '<input type="text" class="form-control" name="txtAchternaam" id="txtAchternaam" placeholder="Achternaam"> ' +
                                '</div> ' +
                                '<div class="form-group col-md-12"> ' +
                                    '<label for="Titel">Titel</label> ' +
                                    '<input type="text" class="form-control" name="txtTitel" id="txtTitel" placeholder="Titel"> ' +
                                '</div> <div class="form-group col-md-12"> ' +
                                    '<label for="Woonplaats">Woonplaats</label> ' +
                                    '<input type="text" class="form-control" name="txtWoonplaats" id="txtWoonplaats" placeholder="Woonplaats"> ' +
                                '</div> ' +
                            '</div> ' +
                        '</div> ' +
                        '<div class="col-md-6"> ' +
                            '<h3>Personal Info</h3> ' +
                               '<p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus.</p> </div> </div> </div>'

        var next =  '<li class="next"><a href="#" class="btn btn-default" id="savePersonalia">Volgende <i class="fa fa-long-arrow-right"></i></a></li>'

    }
    else {
        var formPersonalia =
            '<div class="tab-pane active fade in" id="tab1"> ' +
            '<div class="row margin-bottom-10"> ' +
            '<div class="col-md-6"> ' +
            '<div class="row"> ' +
            '<div class="form-group col-md-6"> ' +
            '<label for="Voornaam">Voornaam</label> ' +
            '<input type="text" class="form-control" name="txtVoornaam" id="txtVoornaam" placeholder="Voornaam" value="'+ cv.voornaam  +'"> ' +
            '</div> ' +
            '<div class="form-group col-md-6"> ' +
            '<label for="Achternaam">Achternaam</label> ' +
            '<input type="text" class="form-control" name="txtAchternaam" id="txtAchternaam" placeholder="Achternaam" value="'+ cv.achternaam  +'"> ' +
            '</div> ' +
            '<div class="form-group col-md-12"> ' +
            '<label for="Titel">Titel</label> ' +
            '<input type="text" class="form-control" name="txtTitel" id="txtTitel" placeholder="Titel" value="'+ cv.titel  +'"> ' +
            '</div> <div class="form-group col-md-12"> ' +
            '<label for="Woonplaats">Woonplaats</label> ' +
            '<input type="text" class="form-control" name="txtWoonplaats" id="txtWoonplaats" placeholder="Woonplaats" value="'+ cv.woonplaats  +'" > ' +
            '</div> ' +
            '</div> ' +
            '</div> ' +
            '<div class="col-md-6"> ' +
            '<h3>Personal Info</h3> ' +
            '<p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus.</p> </div> </div> </div>'

            var next =  '<li class="next"><a href="#" class="btn btn-default" id="updatePersonalia">Volgende <i class="fa fa-long-arrow-right"></i></a></li>'


    }



    return formPersonalia + next
}

